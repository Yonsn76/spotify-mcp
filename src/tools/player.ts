/**
 * Herramienta consolidada de reproducción
 */
import type { MaxInt } from '@spotify/web-api-ts-sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import { ejecutarPeticion, ejecutarPeticionPlayer } from '../core/spotify.js';
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
  descripcion: `Controla reproducción de Spotify. MANEJO DE ERRORES:
- Si NINGUNA acción funciona (play, pause, next, etc. todas fallan): Pide al usuario que MANUALMENTE reproduzca cualquier canción en Spotify primero. Esto activa la sesión del reproductor. Una vez que haya música sonando (aunque sea pausada), las herramientas funcionarán.
- Si error "No hay dispositivo activo": Usa spotifyInfo(accion="devices") para verificar. Si no hay dispositivos, usa spotifyPlayer(accion="openApp") para abrir Spotify desktop. Si falla, usa openApp con valor=true para abrir Spotify Web. Después de abrir, pide al usuario que espere a que cargue y REPRODUZCA algo manualmente.
- Si error "Premium requerido": Informa al usuario que necesita Spotify Premium para controlar reproducción.
- Para reproducir: Primero busca con spotifyInfo(accion="search"), luego usa el ID obtenido con play.
IMPORTANTE: Spotify requiere que haya una sesión de reproducción activa. Si el usuario acaba de abrir Spotify sin reproducir nada, las herramientas no funcionarán hasta que reproduzca algo manualmente.`,
  esquema: {
    accion: z.enum(['play', 'pause', 'resume', 'next', 'prev', 'volume', 'shuffle', 'repeat', 'seek', 'queue', 'transfer', 'playLiked', 'openApp'])
      .describe('play=reproducir(uri o tipo+id), pause/resume, next/prev, volume(valor:0-100), shuffle(valor:bool), repeat(valor:track/context/off), seek(valor:ms), queue=agregar a cola, transfer=cambiar dispositivo, playLiked=reproducir Me gusta, openApp=abrir Spotify(valor:true=web)'),
    uri: z.string().optional().describe('URI completo de Spotify ej: spotify:track:ID (alternativa a tipo+id)'),
    tipo: z.enum(['track', 'album', 'artist', 'playlist']).optional().describe('Tipo de contenido para play/queue'),
    id: z.string().optional().describe('ID del contenido (obtener de spotifyInfo search)'),
    valor: z.union([z.number(), z.boolean(), z.string()]).optional().describe('Valor según acción: volume(0-100), shuffle(bool), repeat(track/context/off), seek(ms), openApp(true=forzar web)'),
    dispositivo: z.string().optional().describe('ID del dispositivo (obtener de spotifyInfo devices)'),
    enContexto: z.boolean().optional().describe('Para tracks: reproducir en contexto del álbum (default: true, false=solo la canción)'),
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
        
        const res = await ejecutarPeticionPlayer(async (api) => {
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
        }, 'play');
        return { content: [{ type: 'text', text: res.ok ? mensaje : res.error }] };
      }

      case 'pause': {
        const res = await ejecutarPeticionPlayer(async (api) => { await api.player.pausePlayback(device); }, 'pause');
        return { content: [{ type: 'text', text: res.ok ? '⏸️ Pausado' : res.error }] };
      }

      case 'resume': {
        const res = await ejecutarPeticionPlayer(async (api) => { await api.player.startResumePlayback(device); }, 'resume');
        return { content: [{ type: 'text', text: res.ok ? '▶️ Reanudado' : res.error }] };
      }

      case 'next': {
        const res = await ejecutarPeticionPlayer(async (api) => { await api.player.skipToNext(device); }, 'next');
        return { content: [{ type: 'text', text: res.ok ? '⏭️ Siguiente' : res.error }] };
      }

      case 'prev': {
        const res = await ejecutarPeticionPlayer(async (api) => { await api.player.skipToPrevious(device); }, 'prev');
        return { content: [{ type: 'text', text: res.ok ? '⏮️ Anterior' : res.error }] };
      }

      case 'volume': {
        const vol = typeof valor === 'number' ? valor : 50;
        const res = await ejecutarPeticionPlayer(async (api) => { await api.player.setPlaybackVolume(Math.min(100, Math.max(0, vol)) as MaxInt<100>, device); }, 'volume');
        return { content: [{ type: 'text', text: res.ok ? `🔊 Volumen: ${vol}%` : res.error }] };
      }

      case 'shuffle': {
        const activar = typeof valor === 'boolean' ? valor : true;
        const res = await ejecutarPeticionPlayer(async (api) => { await api.player.togglePlaybackShuffle(activar, device); }, 'shuffle');
        return { content: [{ type: 'text', text: res.ok ? `🔀 Aleatorio ${activar ? 'activado' : 'desactivado'}` : res.error }] };
      }

      case 'repeat': {
        const modo = typeof valor === 'string' && ['track', 'context', 'off'].includes(valor) ? valor as 'track' | 'context' | 'off' : 'off';
        const res = await ejecutarPeticionPlayer(async (api) => { await api.player.setRepeatMode(modo, device); }, 'repeat');
        const modos = { track: 'canción', context: 'álbum/playlist', off: 'desactivado' };
        return { content: [{ type: 'text', text: res.ok ? `🔁 Repetición: ${modos[modo]}` : res.error }] };
      }

      case 'seek': {
        const posMs = typeof valor === 'number' ? valor : 0;
        const res = await ejecutarPeticionPlayer(async (api) => { await api.player.seekToPosition(posMs, device); }, 'seek');
        const min = Math.floor(posMs / 60000);
        const seg = Math.floor((posMs % 60000) / 1000);
        return { content: [{ type: 'text', text: res.ok ? `⏩ Posición: ${min}:${seg.toString().padStart(2, '0')}` : res.error }] };
      }

      case 'queue': {
        const queueUri = uri || (tipo && id ? `spotify:${tipo}:${id}` : undefined);
        if (!queueUri) return { content: [{ type: 'text', text: 'Error: Proporciona uri o tipo+id' }] };
        const res = await ejecutarPeticionPlayer(async (api) => { await api.player.addItemToPlaybackQueue(queueUri, device); }, 'queue');
        return { content: [{ type: 'text', text: res.ok ? '➕ Agregado a la cola' : res.error }] };
      }

      case 'transfer': {
        if (!dispositivo) return { content: [{ type: 'text', text: 'Error: Proporciona dispositivo' }] };
        const res = await ejecutarPeticionPlayer(async (api) => { await api.player.transferPlayback([dispositivo], true); }, 'transfer');
        return { content: [{ type: 'text', text: res.ok ? '📱 Reproducción transferida' : res.error }] };
      }

      case 'playLiked': {
        const shuffle = typeof valor === 'boolean' ? valor : false;
        const res = await ejecutarPeticionPlayer(async (api) => {
          const perfil = await api.currentUser.profile();
          if (shuffle) await api.player.togglePlaybackShuffle(true, device);
          await api.player.startResumePlayback(device, `spotify:user:${perfil.id}:collection`);
        }, 'playLiked');
        return { content: [{ type: 'text', text: res.ok ? `💚 Reproduciendo Me gusta${shuffle ? ' (aleatorio)' : ''}` : res.error }] };
      }

      case 'openApp': {
        const plataforma = process.platform;
        const forzarWeb = typeof valor === 'boolean' ? valor : false;
        const urlWeb = 'https://open.spotify.com';
        
        if (forzarWeb) {
          await abrirEnNavegador(urlWeb, plataforma);
          return { content: [{ type: 'text', text: '🌐 Abriendo Spotify Web... IMPORTANTE: Pide al usuario que espere a que cargue completamente y te avise. Luego usa spotifyInfo(accion="devices") para verificar que el dispositivo esté disponible antes de reproducir.' }] };
        }
        try {
          if (plataforma === 'win32') await execAsync('start spotify:');
          else if (plataforma === 'darwin') await execAsync('open -a Spotify');
          else await execAsync('spotify &');
          return { content: [{ type: 'text', text: '🎵 Abriendo Spotify Desktop... IMPORTANTE: Pide al usuario que espere a que cargue completamente y te avise. Luego usa spotifyInfo(accion="devices") para verificar que el dispositivo esté disponible antes de reproducir.' }] };
        } catch {
          await abrirEnNavegador(urlWeb, plataforma);
          return { content: [{ type: 'text', text: '🌐 No se encontró Spotify Desktop, abriendo Spotify Web... IMPORTANTE: Pide al usuario que espere a que cargue completamente y te avise. Luego usa spotifyInfo(accion="devices") para verificar.' }] };
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
