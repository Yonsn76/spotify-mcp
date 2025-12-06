/**
 * Herramienta consolidada de reproducción
 */
import type { MaxInt } from '@spotify/web-api-ts-sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import { ejecutarPeticion } from '../core/spotify.js';
import type { ContextoExtra, Herramienta } from '../core/tipos.js';

const execAsync = promisify(exec);

const spotifyPlayer: Herramienta<{
  accion: z.ZodEnum<['play', 'pause', 'resume', 'next', 'prev', 'volume', 'shuffle', 'repeat', 'seek', 'queue', 'transfer', 'playLiked', 'openApp']>;
  uri: z.ZodOptional<z.ZodString>;
  tipo: z.ZodOptional<z.ZodEnum<['track', 'album', 'artist', 'playlist']>>;
  id: z.ZodOptional<z.ZodString>;
  valor: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodBoolean, z.ZodString]>>;
  dispositivo: z.ZodOptional<z.ZodString>;
  enContexto: z.ZodOptional<z.ZodBoolean>;
}> = {
  nombre: 'spotifyPlayer',
  descripcion: 'Controla la reproducción: play, pause, next, prev, volume, shuffle, repeat, seek, queue, transfer, playLiked, openApp',
  esquema: {
    accion: z.enum(['play', 'pause', 'resume', 'next', 'prev', 'volume', 'shuffle', 'repeat', 'seek', 'queue', 'transfer', 'playLiked', 'openApp'])
      .describe('play=reproducir, pause/resume, next/prev, volume(0-100), shuffle(true/false), repeat(track/context/off), seek(ms), queue=agregar, transfer=cambiar dispositivo, playLiked=me gusta, openApp=abrir app'),
    uri: z.string().optional().describe('URI de Spotify (para play/queue)'),
    tipo: z.enum(['track', 'album', 'artist', 'playlist']).optional().describe('Tipo de contenido (para play/queue)'),
    id: z.string().optional().describe('ID del contenido (para play/queue)'),
    valor: z.union([z.number(), z.boolean(), z.string()]).optional().describe('Valor según acción: volume(0-100), shuffle(bool), repeat(track/context/off), seek(ms)'),
    dispositivo: z.string().optional().describe('ID del dispositivo'),
    enContexto: z.boolean().optional().describe('Para tracks: reproducir en contexto del álbum (default: true)'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const { accion, uri, tipo, id, valor, dispositivo, enContexto = true } = args;
    const device = dispositivo || '';

    switch (accion) {
      case 'play': {
        if (!(uri || (tipo && id))) {
          return { content: [{ type: 'text', text: 'Error: Proporciona uri o tipo+id' }] };
        }
        const spotifyUri = uri || `spotify:${tipo}:${id}`;
        let mensaje = `▶️ Reproduciendo ${tipo || 'música'}`;
        
        await ejecutarPeticion(async (api) => {
          if (tipo === 'track' && id && enContexto) {
            const track = await api.tracks.get(id);
            if (track.album?.uri) {
              await api.player.startResumePlayback(device, track.album.uri, undefined, { uri: spotifyUri });
              mensaje = `▶️ "${track.name}" en álbum "${track.album.name}"`;
              return;
            }
          }
          if (tipo === 'track') {
            await api.player.startResumePlayback(device, undefined, [spotifyUri]);
          } else {
            await api.player.startResumePlayback(device, spotifyUri);
          }
        });
        return { content: [{ type: 'text', text: mensaje }] };
      }

      case 'pause':
        await ejecutarPeticion(async (api) => { await api.player.pausePlayback(device); });
        return { content: [{ type: 'text', text: '⏸️ Pausado' }] };

      case 'resume':
        await ejecutarPeticion(async (api) => { await api.player.startResumePlayback(device); });
        return { content: [{ type: 'text', text: '▶️ Reanudado' }] };

      case 'next':
        await ejecutarPeticion(async (api) => { await api.player.skipToNext(device); });
        return { content: [{ type: 'text', text: '⏭️ Siguiente' }] };

      case 'prev':
        await ejecutarPeticion(async (api) => { await api.player.skipToPrevious(device); });
        return { content: [{ type: 'text', text: '⏮️ Anterior' }] };

      case 'volume': {
        const vol = typeof valor === 'number' ? valor : 50;
        await ejecutarPeticion(async (api) => { await api.player.setPlaybackVolume(Math.min(100, Math.max(0, vol)) as MaxInt<100>, device); });
        return { content: [{ type: 'text', text: `🔊 Volumen: ${vol}%` }] };
      }

      case 'shuffle': {
        const activar = typeof valor === 'boolean' ? valor : true;
        await ejecutarPeticion(async (api) => { await api.player.togglePlaybackShuffle(activar, device); });
        return { content: [{ type: 'text', text: `🔀 Aleatorio ${activar ? 'activado' : 'desactivado'}` }] };
      }

      case 'repeat': {
        const modo = typeof valor === 'string' && ['track', 'context', 'off'].includes(valor) ? valor as 'track' | 'context' | 'off' : 'off';
        await ejecutarPeticion(async (api) => { await api.player.setRepeatMode(modo, device); });
        const modos = { track: 'canción', context: 'álbum/playlist', off: 'desactivado' };
        return { content: [{ type: 'text', text: `🔁 Repetición: ${modos[modo]}` }] };
      }

      case 'seek': {
        const posMs = typeof valor === 'number' ? valor : 0;
        await ejecutarPeticion(async (api) => { await api.player.seekToPosition(posMs, device); });
        const min = Math.floor(posMs / 60000);
        const seg = Math.floor((posMs % 60000) / 1000);
        return { content: [{ type: 'text', text: `⏩ Posición: ${min}:${seg.toString().padStart(2, '0')}` }] };
      }

      case 'queue': {
        const queueUri = uri || (tipo && id ? `spotify:${tipo}:${id}` : undefined);
        if (!queueUri) return { content: [{ type: 'text', text: 'Error: Proporciona uri o tipo+id' }] };
        await ejecutarPeticion(async (api) => { await api.player.addItemToPlaybackQueue(queueUri, device); });
        return { content: [{ type: 'text', text: '➕ Agregado a la cola' }] };
      }

      case 'transfer': {
        if (!dispositivo) return { content: [{ type: 'text', text: 'Error: Proporciona dispositivo' }] };
        await ejecutarPeticion(async (api) => { await api.player.transferPlayback([dispositivo], true); });
        return { content: [{ type: 'text', text: '📱 Reproducción transferida' }] };
      }

      case 'playLiked': {
        const shuffle = typeof valor === 'boolean' ? valor : false;
        await ejecutarPeticion(async (api) => {
          const perfil = await api.currentUser.profile();
          if (shuffle) await api.player.togglePlaybackShuffle(true, device);
          await api.player.startResumePlayback(device, `spotify:user:${perfil.id}:collection`);
        });
        return { content: [{ type: 'text', text: `💚 Reproduciendo Me gusta${shuffle ? ' (aleatorio)' : ''}` }] };
      }

      case 'openApp': {
        const plataforma = process.platform;
        const forzarWeb = typeof valor === 'boolean' ? valor : false;
        const urlWeb = 'https://open.spotify.com';
        
        if (forzarWeb) {
          await abrirEnNavegador(urlWeb, plataforma);
          return { content: [{ type: 'text', text: '🌐 Abriendo Spotify Web...' }] };
        }
        try {
          if (plataforma === 'win32') await execAsync('start spotify:');
          else if (plataforma === 'darwin') await execAsync('open -a Spotify');
          else await execAsync('spotify &');
          return { content: [{ type: 'text', text: '🎵 Abriendo Spotify...' }] };
        } catch {
          await abrirEnNavegador(urlWeb, plataforma);
          return { content: [{ type: 'text', text: '🌐 Abriendo Spotify Web...' }] };
        }
      }

      default:
        return { content: [{ type: 'text', text: '❌ Acción no válida' }] };
    }
  },
};

async function abrirEnNavegador(url: string, plataforma: string): Promise<void> {
  if (plataforma === 'win32') await execAsync(`start "" "${url}"`);
  else if (plataforma === 'darwin') await execAsync(`open "${url}"`);
  else await execAsync(`xdg-open "${url}"`);
}

export const herramientasPlayer = [spotifyPlayer];
