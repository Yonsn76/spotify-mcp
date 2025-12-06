/**
 * Herramienta consolidada de búsqueda e información
 */
import type { MaxInt } from '@spotify/web-api-ts-sdk';
import { z } from 'zod';
import { ejecutarPeticion, formatearDuracion } from '../core/spotify.js';
import type { CancionSpotify, ContextoExtra, Herramienta } from '../core/tipos.js';

function esCancion(item: any): item is CancionSpotify {
  return item?.type === 'track' && Array.isArray(item.artists) && item.album?.name;
}

const spotifyInfo: Herramienta<{
  accion: z.ZodEnum<['search', 'nowPlaying', 'devices', 'profile', 'queue', 'history', 'saved', 'playlists', 'playlistTracks', 'albumTracks', 'artistTop', 'topTracks', 'topArtists', 'state']>;
  consulta: z.ZodOptional<z.ZodString>;
  tipo: z.ZodOptional<z.ZodEnum<['track', 'album', 'artist', 'playlist']>>;
  id: z.ZodOptional<z.ZodString>;
  limite: z.ZodOptional<z.ZodNumber>;
  offset: z.ZodOptional<z.ZodNumber>;
  periodo: z.ZodOptional<z.ZodEnum<['short_term', 'medium_term', 'long_term']>>;
  mercado: z.ZodOptional<z.ZodString>;
}> = {
  nombre: 'spotifyInfo',
  descripcion: 'Busca y obtiene información: search, nowPlaying, devices, profile, queue, history, saved, playlists, playlistTracks, albumTracks, artistTop, topTracks, topArtists, state',
  esquema: {
    accion: z.enum(['search', 'nowPlaying', 'devices', 'profile', 'queue', 'history', 'saved', 'playlists', 'playlistTracks', 'albumTracks', 'artistTop', 'topTracks', 'topArtists', 'state'])
      .describe('Acción a realizar'),
    consulta: z.string().optional().describe('Texto de búsqueda (para search)'),
    tipo: z.enum(['track', 'album', 'artist', 'playlist']).optional().describe('Tipo de búsqueda'),
    id: z.string().optional().describe('ID de playlist/album/artista'),
    limite: z.number().min(1).max(50).optional().describe('Cantidad de resultados (1-50)'),
    offset: z.number().min(0).optional().describe('Posición inicial'),
    periodo: z.enum(['short_term', 'medium_term', 'long_term']).optional().describe('Periodo para top: short=4sem, medium=6mes, long=años'),
    mercado: z.string().optional().describe('Código país ISO (ES, MX, US)'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const { accion, consulta, tipo, id, limite = 20, offset = 0, periodo = 'medium_term', mercado = 'ES' } = args;

    switch (accion) {
      case 'search': {
        if (!consulta || !tipo) return { content: [{ type: 'text', text: 'Error: Requiere consulta y tipo' }] };
        const res = await ejecutarPeticion((api) => api.search(consulta, [tipo], undefined, limite as MaxInt<50>));
        let texto = '';
        if (tipo === 'track' && res.tracks) {
          texto = res.tracks.items.map((c, i) => `${i + 1}. "${c.name}" - ${c.artists.map((a) => a.name).join(', ')} (${formatearDuracion(c.duration_ms)}) | ID: ${c.id}`).join('\n');
        } else if (tipo === 'album' && res.albums) {
          texto = res.albums.items.map((a, i) => `${i + 1}. "${a.name}" - ${a.artists.map((x) => x.name).join(', ')} | ID: ${a.id}`).join('\n');
        } else if (tipo === 'artist' && res.artists) {
          texto = res.artists.items.map((a, i) => `${i + 1}. ${a.name} | ID: ${a.id}`).join('\n');
        } else if (tipo === 'playlist' && res.playlists) {
          texto = res.playlists.items.map((p, i) => `${i + 1}. "${p?.name ?? '?'}" por ${p?.owner?.display_name ?? '?'} | ID: ${p?.id}`).join('\n');
        }
        return { content: [{ type: 'text', text: texto ? `# Resultados: "${consulta}"\n\n${texto}` : 'Sin resultados' }] };
      }

      case 'nowPlaying': {
        const actual = await ejecutarPeticion((api) => api.player.getCurrentlyPlayingTrack());
        if (!actual?.item) return { content: [{ type: 'text', text: '🔇 Nada reproduciéndose' }] };
        if (!esCancion(actual.item)) return { content: [{ type: 'text', text: '🎙️ Reproduciendo podcast' }] };
        const { item } = actual;
        return { content: [{ type: 'text', text: `# ${actual.is_playing ? '▶️' : '⏸️'} ${item.name}\n\n**Artista**: ${item.artists.map((a) => a.name).join(', ')}\n**Álbum**: ${item.album.name}\n**Progreso**: ${formatearDuracion(actual.progress_ms || 0)} / ${formatearDuracion(item.duration_ms)}\n**ID**: ${item.id}` }] };
      }

      case 'devices': {
        const d = await ejecutarPeticion((api) => api.player.getAvailableDevices());
        if (!d?.devices?.length) return { content: [{ type: 'text', text: '📵 Sin dispositivos. Abre Spotify.' }] };
        const texto = d.devices.map((x, i) => `${i + 1}. ${x.name} (${x.type})${x.is_active ? ' ✓' : ''} | Vol: ${x.volume_percent}% | ID: ${x.id}`).join('\n');
        return { content: [{ type: 'text', text: `# Dispositivos\n\n${texto}` }] };
      }

      case 'profile': {
        const p = await ejecutarPeticion((api) => api.currentUser.profile());
        return { content: [{ type: 'text', text: `# Perfil\n\n**Nombre**: ${p.display_name}\n**Email**: ${p.email}\n**País**: ${p.country}\n**Plan**: ${p.product}\n**ID**: ${p.id}` }] };
      }

      case 'queue': {
        const cola = await ejecutarPeticion((api) => api.player.getUsersQueue());
        if (!cola?.queue?.length) return { content: [{ type: 'text', text: '📭 Cola vacía' }] };
        let actual = '';
        if (cola.currently_playing && esCancion(cola.currently_playing)) {
          actual = `**Ahora**: "${cola.currently_playing.name}" - ${cola.currently_playing.artists.map((a) => a.name).join(', ')}\n\n`;
        }
        const texto = cola.queue.slice(0, limite).map((item, i) => esCancion(item) ? `${i + 1}. "${item.name}" - ${item.artists.map((a) => a.name).join(', ')} | ID: ${item.id}` : `${i + 1}. ?`).join('\n');
        return { content: [{ type: 'text', text: `# Cola\n\n${actual}**Siguiente:**\n${texto}` }] };
      }

      case 'history': {
        const h = await ejecutarPeticion((api) => api.player.getRecentlyPlayedTracks(limite as MaxInt<50>));
        if (!h.items.length) return { content: [{ type: 'text', text: '📭 Sin historial' }] };
        const texto = h.items.map((item, i) => esCancion(item.track) ? `${i + 1}. "${item.track.name}" - ${item.track.artists.map((a) => a.name).join(', ')} | ID: ${item.track.id}` : `${i + 1}. ?`).join('\n');
        return { content: [{ type: 'text', text: `# Historial\n\n${texto}` }] };
      }

      case 'saved': {
        const g = await ejecutarPeticion((api) => api.currentUser.tracks.savedTracks(limite as MaxInt<50>, offset));
        if (!g.items.length) return { content: [{ type: 'text', text: '📭 Sin guardadas' }] };
        const texto = g.items.map((item, i) => esCancion(item.track) ? `${offset + i + 1}. "${item.track.name}" - ${item.track.artists.map((a) => a.name).join(', ')} | ID: ${item.track.id}` : `${offset + i + 1}. ?`).join('\n');
        return { content: [{ type: 'text', text: `# Guardadas (${offset + 1}-${offset + g.items.length} de ${g.total})\n\n${texto}` }] };
      }

      case 'playlists': {
        const pl = await ejecutarPeticion((api) => api.currentUser.playlists.playlists(limite as MaxInt<50>));
        if (!pl.items.length) return { content: [{ type: 'text', text: '📭 Sin playlists' }] };
        const texto = pl.items.map((p, i) => `${i + 1}. "${p.name}" (${p.tracks?.total || 0} canciones) | ID: ${p.id}`).join('\n');
        return { content: [{ type: 'text', text: `# Tus Playlists\n\n${texto}` }] };
      }

      case 'playlistTracks': {
        if (!id) return { content: [{ type: 'text', text: 'Error: Requiere id de playlist' }] };
        const c = await ejecutarPeticion((api) => api.playlists.getPlaylistItems(id, undefined, undefined, limite as MaxInt<50>));
        if (!c.items?.length) return { content: [{ type: 'text', text: '📭 Playlist vacía' }] };
        const texto = c.items.map((item, i) => item.track && esCancion(item.track) ? `${i + 1}. "${item.track.name}" - ${item.track.artists.map((a) => a.name).join(', ')} | ID: ${item.track.id}` : `${i + 1}. ?`).join('\n');
        return { content: [{ type: 'text', text: `# Canciones de Playlist\n\n${texto}` }] };
      }

      case 'albumTracks': {
        if (!id) return { content: [{ type: 'text', text: 'Error: Requiere id de álbum' }] };
        const album = await ejecutarPeticion((api) => api.albums.get(id));
        if (!album?.tracks?.items?.length) return { content: [{ type: 'text', text: '📭 Sin canciones' }] };
        const canciones = album.tracks.items.slice(0, limite);
        const texto = canciones.map((c, i) => `${i + 1}. "${c.name}" (${formatearDuracion(c.duration_ms)}) | ID: ${c.id}`).join('\n');
        return { content: [{ type: 'text', text: `# Álbum: ${album.name}\n\n${texto}` }] };
      }

      case 'artistTop': {
        if (!id) return { content: [{ type: 'text', text: 'Error: Requiere id de artista' }] };
        const top = await ejecutarPeticion((api) => api.artists.topTracks(id, mercado as 'US'));
        if (!top?.tracks?.length) return { content: [{ type: 'text', text: '📭 Sin canciones' }] };
        const texto = top.tracks.map((c, i) => `${i + 1}. "${c.name}" (${formatearDuracion(c.duration_ms)}) | ID: ${c.id}`).join('\n');
        return { content: [{ type: 'text', text: `# Top del Artista\n\n${texto}` }] };
      }

      case 'topTracks': {
        const top = await ejecutarPeticion((api) => api.currentUser.topItems('tracks', periodo, limite as MaxInt<50>));
        if (!top?.items?.length) return { content: [{ type: 'text', text: '📭 Sin datos' }] };
        const periodos = { short_term: '4 semanas', medium_term: '6 meses', long_term: 'siempre' };
        const texto = top.items.map((c, i) => `${i + 1}. "${c.name}" - ${c.artists.map((a) => a.name).join(', ')} | ID: ${c.id}`).join('\n');
        return { content: [{ type: 'text', text: `# Top Canciones (${periodos[periodo]})\n\n${texto}` }] };
      }

      case 'topArtists': {
        const top = await ejecutarPeticion((api) => api.currentUser.topItems('artists', periodo, limite as MaxInt<50>));
        if (!top?.items?.length) return { content: [{ type: 'text', text: '📭 Sin datos' }] };
        const periodos = { short_term: '4 semanas', medium_term: '6 meses', long_term: 'siempre' };
        const texto = top.items.map((a, i) => `${i + 1}. ${a.name} | Géneros: ${a.genres?.slice(0, 3).join(', ') || 'N/A'} | ID: ${a.id}`).join('\n');
        return { content: [{ type: 'text', text: `# Top Artistas (${periodos[periodo]})\n\n${texto}` }] };
      }

      case 'state': {
        const e = await ejecutarPeticion((api) => api.player.getPlaybackState());
        if (!e) return { content: [{ type: 'text', text: '📵 Sin sesión activa' }] };
        const rep = { track: 'Canción', context: 'Álbum/Playlist', off: 'No' }[e.repeat_state] || e.repeat_state;
        return { content: [{ type: 'text', text: `# Estado\n\n**Dispositivo**: ${e.device?.name || '?'}\n**Volumen**: ${e.device?.volume_percent ?? 'N/A'}%\n**Aleatorio**: ${e.shuffle_state ? 'Sí' : 'No'}\n**Repetición**: ${rep}\n**Reproduciendo**: ${e.is_playing ? 'Sí' : 'No'}` }] };
      }

      default:
        return { content: [{ type: 'text', text: '❌ Acción no válida' }] };
    }
  },
};

export const herramientasInfo = [spotifyInfo];
