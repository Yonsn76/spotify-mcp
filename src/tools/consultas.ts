/**
 * Herramientas de consulta para obtener información de Spotify
 * Incluye búsqueda, reproducción actual, playlists, historial, etc.
 */

import type { MaxInt } from '@spotify/web-api-ts-sdk';
import { z } from 'zod';
import { ejecutarPeticion, formatearDuracion } from '../core/spotify.js';
import type { CancionSpotify, ContextoExtra, Herramienta } from '../core/tipos.js';

/** Verifica si un elemento es una canción válida de Spotify */
function esCancion(item: any): item is CancionSpotify {
  return item?.type === 'track' && Array.isArray(item.artists) && item.album?.name;
}

/** Busca contenido en Spotify */
const buscar: Herramienta<{
  consulta: z.ZodString;
  tipo: z.ZodEnum<['track', 'album', 'artist', 'playlist']>;
  limite: z.ZodOptional<z.ZodNumber>;
}> = {
  nombre: 'buscar',
  descripcion: 'Busca canciones, álbumes, artistas o playlists en Spotify',
  esquema: {
    consulta: z.string().describe('Texto a buscar'),
    tipo: z.enum(['track', 'album', 'artist', 'playlist']).describe('Tipo de contenido'),
    limite: z.number().min(1).max(50).optional().describe('Cantidad de resultados (1-50)'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const { consulta, tipo, limite = 10 } = args;
    const resultados = await ejecutarPeticion((api) => api.search(consulta, [tipo], undefined, limite as MaxInt<50>));
    let texto = '';

    if (tipo === 'track' && resultados.tracks) {
      texto = resultados.tracks.items.map((c, i) => 
        `${i + 1}. "${c.name}" - ${c.artists.map((a) => a.name).join(', ')} (${formatearDuracion(c.duration_ms)}) | ID: ${c.id}`
      ).join('\n');
    } else if (tipo === 'album' && resultados.albums) {
      texto = resultados.albums.items.map((a, i) => 
        `${i + 1}. "${a.name}" - ${a.artists.map((x) => x.name).join(', ')} | ID: ${a.id}`
      ).join('\n');
    } else if (tipo === 'artist' && resultados.artists) {
      texto = resultados.artists.items.map((a, i) => `${i + 1}. ${a.name} | ID: ${a.id}`).join('\n');
    } else if (tipo === 'playlist' && resultados.playlists) {
      texto = resultados.playlists.items.map((p, i) => 
        `${i + 1}. "${p?.name ?? 'Sin nombre'}" por ${p?.owner?.display_name ?? '?'} | ID: ${p?.id}`
      ).join('\n');
    }

    return { content: [{ type: 'text', text: texto ? `# Resultados: "${consulta}"\n\n${texto}` : 'Sin resultados' }] };
  },
};


/** Obtiene la canción que se está reproduciendo */
const obtenerReproduccionActual: Herramienta<Record<string, never>> = {
  nombre: 'obtenerReproduccionActual',
  descripcion: 'Obtiene información de la canción que se está reproduciendo',
  esquema: {},
  ejecutar: async (_args, _extra: ContextoExtra) => {
    const actual = await ejecutarPeticion((api) => api.player.getCurrentlyPlayingTrack());
    if (!actual?.item) return { content: [{ type: 'text', text: '🔇 No hay nada reproduciéndose' }] };
    if (!esCancion(actual.item)) return { content: [{ type: 'text', text: '🎙️ Reproduciendo podcast' }] };

    const { item } = actual;
    return {
      content: [{
        type: 'text',
        text: `# ${actual.is_playing ? '▶️ Reproduciendo' : '⏸️ Pausado'}\n\n` +
          `**Canción**: ${item.name}\n**Artista**: ${item.artists.map((a) => a.name).join(', ')}\n` +
          `**Álbum**: ${item.album.name}\n**Progreso**: ${formatearDuracion(actual.progress_ms || 0)} / ${formatearDuracion(item.duration_ms)}\n**ID**: ${item.id}`,
      }],
    };
  },
};

/** Obtiene las playlists del usuario */
const obtenerMisPlaylists: Herramienta<{ limite: z.ZodOptional<z.ZodNumber> }> = {
  nombre: 'obtenerMisPlaylists',
  descripcion: 'Obtiene tus playlists de Spotify',
  esquema: { limite: z.number().min(1).max(50).optional().describe('Cantidad máxima (1-50)') },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const playlists = await ejecutarPeticion((api) => api.currentUser.playlists.playlists((args.limite ?? 50) as MaxInt<50>));
    if (!playlists.items.length) return { content: [{ type: 'text', text: '📭 No tienes playlists' }] };
    const texto = playlists.items.map((p, i) => `${i + 1}. "${p.name}" (${p.tracks?.total || 0} canciones) | ID: ${p.id}`).join('\n');
    return { content: [{ type: 'text', text: `# Tus Playlists\n\n${texto}` }] };
  },
};

/** Obtiene las canciones de una playlist */
const obtenerCancionesPlaylist: Herramienta<{ playlistId: z.ZodString; limite: z.ZodOptional<z.ZodNumber> }> = {
  nombre: 'obtenerCancionesPlaylist',
  descripcion: 'Obtiene las canciones de una playlist',
  esquema: {
    playlistId: z.string().describe('ID de la playlist'),
    limite: z.number().min(1).max(50).optional().describe('Cantidad máxima (1-50)'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const canciones = await ejecutarPeticion((api) => api.playlists.getPlaylistItems(args.playlistId, undefined, undefined, (args.limite ?? 50) as MaxInt<50>));
    if (!canciones.items?.length) return { content: [{ type: 'text', text: '📭 Playlist vacía' }] };
    const texto = canciones.items.map((item, i) => {
      if (!item.track) return `${i + 1}. [Eliminada]`;
      if (esCancion(item.track)) return `${i + 1}. "${item.track.name}" - ${item.track.artists.map((a) => a.name).join(', ')} | ID: ${item.track.id}`;
      return `${i + 1}. Desconocido`;
    }).join('\n');
    return { content: [{ type: 'text', text: `# Canciones de Playlist\n\n${texto}` }] };
  },
};

/** Obtiene el historial de reproducción */
const obtenerHistorial: Herramienta<{ limite: z.ZodOptional<z.ZodNumber> }> = {
  nombre: 'obtenerHistorial',
  descripcion: 'Obtiene las canciones reproducidas recientemente',
  esquema: { limite: z.number().min(1).max(50).optional().describe('Cantidad máxima (1-50)') },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const historial = await ejecutarPeticion((api) => api.player.getRecentlyPlayedTracks((args.limite ?? 50) as MaxInt<50>));
    if (!historial.items.length) return { content: [{ type: 'text', text: '📭 Sin historial' }] };
    const texto = historial.items.map((item, i) => {
      if (!item.track || !esCancion(item.track)) return `${i + 1}. Desconocido`;
      return `${i + 1}. "${item.track.name}" - ${item.track.artists.map((a) => a.name).join(', ')} | ID: ${item.track.id}`;
    }).join('\n');
    return { content: [{ type: 'text', text: `# Reproducidas Recientemente\n\n${texto}` }] };
  },
};

/** Obtiene las canciones guardadas */
const obtenerCancionesGuardadas: Herramienta<{ limite: z.ZodOptional<z.ZodNumber>; offset: z.ZodOptional<z.ZodNumber> }> = {
  nombre: 'obtenerCancionesGuardadas',
  descripcion: 'Obtiene tus canciones guardadas (Me gusta)',
  esquema: {
    limite: z.number().min(1).max(50).optional().describe('Cantidad máxima (1-50)'),
    offset: z.number().min(0).optional().describe('Posición inicial'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const { limite = 50, offset = 0 } = args;
    const guardadas = await ejecutarPeticion((api) => api.currentUser.tracks.savedTracks(limite as MaxInt<50>, offset));
    if (!guardadas.items.length) return { content: [{ type: 'text', text: '📭 Sin canciones guardadas' }] };
    const texto = guardadas.items.map((item, i) => {
      if (!item.track || !esCancion(item.track)) return `${offset + i + 1}. Desconocido`;
      return `${offset + i + 1}. "${item.track.name}" - ${item.track.artists.map((a) => a.name).join(', ')} | ID: ${item.track.id}`;
    }).join('\n');
    return { content: [{ type: 'text', text: `# Guardadas (${offset + 1}-${offset + guardadas.items.length} de ${guardadas.total})\n\n${texto}` }] };
  },
};


/** Obtiene los dispositivos disponibles */
const obtenerDispositivos: Herramienta<Record<string, never>> = {
  nombre: 'obtenerDispositivos',
  descripcion: 'Obtiene los dispositivos de Spotify disponibles',
  esquema: {},
  ejecutar: async (_args, _extra: ContextoExtra) => {
    const dispositivos = await ejecutarPeticion((api) => api.player.getAvailableDevices());
    if (!dispositivos?.devices?.length) return { content: [{ type: 'text', text: '📵 Sin dispositivos. Abre Spotify.' }] };
    const texto = dispositivos.devices.map((d, i) => {
      const activo = d.is_active ? ' (Activo)' : '';
      const vol = d.volume_percent !== null ? ` | Vol: ${d.volume_percent}%` : '';
      return `${i + 1}. ${d.name} (${d.type})${activo}${vol} | ID: ${d.id}`;
    }).join('\n');
    return { content: [{ type: 'text', text: `# Dispositivos\n\n${texto}` }] };
  },
};

/** Obtiene el perfil del usuario */
const obtenerPerfil: Herramienta<Record<string, never>> = {
  nombre: 'obtenerPerfil',
  descripcion: 'Obtiene tu perfil de Spotify',
  esquema: {},
  ejecutar: async (_args, _extra: ContextoExtra) => {
    const p = await ejecutarPeticion((api) => api.currentUser.profile());
    return {
      content: [{
        type: 'text',
        text: `# Tu Perfil\n\n**Nombre**: ${p.display_name}\n**Email**: ${p.email}\n**País**: ${p.country}\n**Plan**: ${p.product}\n**Seguidores**: ${p.followers?.total || 0}\n**ID**: ${p.id}`,
      }],
    };
  },
};

/** Obtiene las canciones más escuchadas */
const obtenerTopCanciones: Herramienta<{
  periodo: z.ZodOptional<z.ZodEnum<['short_term', 'medium_term', 'long_term']>>;
  limite: z.ZodOptional<z.ZodNumber>;
}> = {
  nombre: 'obtenerTopCanciones',
  descripcion: 'Obtiene tus canciones más escuchadas',
  esquema: {
    periodo: z.enum(['short_term', 'medium_term', 'long_term']).optional().describe('short_term=4sem, medium_term=6mes, long_term=años'),
    limite: z.number().min(1).max(50).optional().describe('Cantidad (1-50)'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const { periodo = 'medium_term', limite = 20 } = args;
    const top = await ejecutarPeticion((api) => api.currentUser.topItems('tracks', periodo, limite as MaxInt<50>));
    if (!top?.items?.length) return { content: [{ type: 'text', text: '📭 Sin datos' }] };
    const periodos = { short_term: '4 semanas', medium_term: '6 meses', long_term: 'siempre' };
    const texto = top.items.map((c, i) => `${i + 1}. "${c.name}" - ${c.artists.map((a) => a.name).join(', ')} | ID: ${c.id}`).join('\n');
    return { content: [{ type: 'text', text: `# Top Canciones (${periodos[periodo]})\n\n${texto}` }] };
  },
};

/** Obtiene los artistas más escuchados */
const obtenerTopArtistas: Herramienta<{
  periodo: z.ZodOptional<z.ZodEnum<['short_term', 'medium_term', 'long_term']>>;
  limite: z.ZodOptional<z.ZodNumber>;
}> = {
  nombre: 'obtenerTopArtistas',
  descripcion: 'Obtiene tus artistas más escuchados',
  esquema: {
    periodo: z.enum(['short_term', 'medium_term', 'long_term']).optional().describe('short_term=4sem, medium_term=6mes, long_term=años'),
    limite: z.number().min(1).max(50).optional().describe('Cantidad (1-50)'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const { periodo = 'medium_term', limite = 20 } = args;
    const top = await ejecutarPeticion((api) => api.currentUser.topItems('artists', periodo, limite as MaxInt<50>));
    if (!top?.items?.length) return { content: [{ type: 'text', text: '📭 Sin datos' }] };
    const periodos = { short_term: '4 semanas', medium_term: '6 meses', long_term: 'siempre' };
    const texto = top.items.map((a, i) => `${i + 1}. ${a.name} | Géneros: ${a.genres?.slice(0, 3).join(', ') || 'N/A'} | ID: ${a.id}`).join('\n');
    return { content: [{ type: 'text', text: `# Top Artistas (${periodos[periodo]})\n\n${texto}` }] };
  },
};

/** Obtiene las canciones de un álbum */
const obtenerCancionesAlbum: Herramienta<{ albumId: z.ZodString; limite: z.ZodOptional<z.ZodNumber> }> = {
  nombre: 'obtenerCancionesAlbum',
  descripcion: 'Obtiene las canciones de un álbum',
  esquema: {
    albumId: z.string().describe('ID del álbum'),
    limite: z.number().min(1).max(50).optional().describe('Cantidad (1-50)'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const album = await ejecutarPeticion((api) => api.albums.get(args.albumId));
    if (!album?.tracks?.items?.length) return { content: [{ type: 'text', text: '📭 Sin canciones' }] };
    const canciones = album.tracks.items.slice(0, args.limite ?? 50);
    const texto = canciones.map((c, i) => `${i + 1}. "${c.name}" - ${c.artists.map((a) => a.name).join(', ')} (${formatearDuracion(c.duration_ms)}) | ID: ${c.id}`).join('\n');
    return { content: [{ type: 'text', text: `# Álbum: ${album.name}\n\n${texto}` }] };
  },
};

/** Obtiene las canciones top de un artista */
const obtenerTopCancionesArtista: Herramienta<{ artistaId: z.ZodString; mercado: z.ZodOptional<z.ZodString> }> = {
  nombre: 'obtenerTopCancionesArtista',
  descripcion: 'Obtiene las canciones más populares de un artista',
  esquema: {
    artistaId: z.string().describe('ID del artista'),
    mercado: z.string().optional().describe('Código país ISO (ES, MX, US)'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const top = await ejecutarPeticion((api) => api.artists.topTracks(args.artistaId, (args.mercado ?? 'ES') as 'US'));
    if (!top?.tracks?.length) return { content: [{ type: 'text', text: '📭 Sin canciones' }] };
    const texto = top.tracks.map((c, i) => `${i + 1}. "${c.name}" (${formatearDuracion(c.duration_ms)}) | ID: ${c.id}`).join('\n');
    return { content: [{ type: 'text', text: `# Top del Artista\n\n${texto}` }] };
  },
};

/** Obtiene el estado de reproducción */
const obtenerEstadoReproduccion: Herramienta<Record<string, never>> = {
  nombre: 'obtenerEstadoReproduccion',
  descripcion: 'Obtiene el estado actual (aleatorio, repetición, volumen)',
  esquema: {},
  ejecutar: async (_args, _extra: ContextoExtra) => {
    const e = await ejecutarPeticion((api) => api.player.getPlaybackState());
    if (!e) return { content: [{ type: 'text', text: '📵 Sin sesión activa' }] };
    const rep = { track: 'Canción', context: 'Álbum/Playlist', off: 'No' }[e.repeat_state] || e.repeat_state;
    return {
      content: [{
        type: 'text',
        text: `# Estado\n\n**Dispositivo**: ${e.device?.name || '?'} (${e.device?.type || '?'})\n**Volumen**: ${e.device?.volume_percent ?? 'N/A'}%\n**Aleatorio**: ${e.shuffle_state ? 'Sí' : 'No'}\n**Repetición**: ${rep}\n**Reproduciendo**: ${e.is_playing ? 'Sí' : 'No'}`,
      }],
    };
  },
};

/** Obtiene la cola de reproducción */
const obtenerCola: Herramienta<Record<string, never>> = {
  nombre: 'obtenerCola',
  descripcion: 'Obtiene la cola de reproducción actual',
  esquema: {},
  ejecutar: async (_args, _extra: ContextoExtra) => {
    const cola = await ejecutarPeticion((api) => api.player.getUsersQueue());
    if (!cola?.queue?.length) return { content: [{ type: 'text', text: '📭 Cola vacía' }] };
    let actual = '';
    if (cola.currently_playing && esCancion(cola.currently_playing)) {
      actual = `**Ahora**: "${cola.currently_playing.name}" - ${cola.currently_playing.artists.map((a) => a.name).join(', ')}\n\n`;
    }
    const texto = cola.queue.slice(0, 20).map((item, i) => {
      if (esCancion(item)) return `${i + 1}. "${item.name}" - ${item.artists.map((a) => a.name).join(', ')} | ID: ${item.id}`;
      return `${i + 1}. Desconocido`;
    }).join('\n');
    return { content: [{ type: 'text', text: `# Cola\n\n${actual}**Siguiente:**\n${texto}` }] };
  },
};

export const herramientasConsultas = [
  buscar,
  obtenerReproduccionActual,
  obtenerMisPlaylists,
  obtenerCancionesPlaylist,
  obtenerHistorial,
  obtenerCancionesGuardadas,
  obtenerDispositivos,
  obtenerPerfil,
  obtenerTopCanciones,
  obtenerTopArtistas,
  obtenerCancionesAlbum,
  obtenerTopCancionesArtista,
  obtenerEstadoReproduccion,
  obtenerCola,
];
