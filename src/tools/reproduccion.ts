import type { MaxInt } from '@spotify/web-api-ts-sdk';
import { z } from 'zod';
import { ejecutarPeticion } from '../core/spotify.js';
import type { ContextoExtra, Herramienta } from '../core/tipos.js';

const reproducir: Herramienta<{
  uri: z.ZodOptional<z.ZodString>;
  tipo: z.ZodOptional<z.ZodEnum<['track', 'album', 'artist', 'playlist']>>;
  id: z.ZodOptional<z.ZodString>;
  dispositivoId: z.ZodOptional<z.ZodString>;
}> = {
  nombre: 'reproducir',
  descripcion: 'Reproduce una canción, álbum, artista o playlist de Spotify',
  esquema: {
    uri: z.string().optional().describe('URI de Spotify (tiene prioridad sobre tipo e id)'),
    tipo: z.enum(['track', 'album', 'artist', 'playlist']).optional().describe('Tipo de contenido'),
    id: z.string().optional().describe('ID de Spotify del contenido'),
    dispositivoId: z.string().optional().describe('ID del dispositivo donde reproducir'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const { uri, tipo, id, dispositivoId } = args;

    if (!(uri || (tipo && id))) {
      return { content: [{ type: 'text', text: 'Error: Debes proporcionar un URI o un tipo con ID', isError: true }] };
    }

    let spotifyUri = uri || (tipo && id ? `spotify:${tipo}:${id}` : undefined);

    await ejecutarPeticion(async (api) => {
      const dispositivo = dispositivoId || '';
      if (!spotifyUri) {
        await api.player.startResumePlayback(dispositivo);
        return;
      }
      if (tipo === 'track') {
        await api.player.startResumePlayback(dispositivo, undefined, [spotifyUri]);
      } else {
        await api.player.startResumePlayback(dispositivo, spotifyUri);
      }
    });

    return { content: [{ type: 'text', text: `▶️ Reproduciendo ${tipo || 'música'} ${id ? `(ID: ${id})` : ''}` }] };
  },
};

const pausar: Herramienta<{ dispositivoId: z.ZodOptional<z.ZodString> }> = {
  nombre: 'pausar',
  descripcion: 'Pausa la reproducción de Spotify',
  esquema: { dispositivoId: z.string().optional().describe('ID del dispositivo') },
  ejecutar: async (args, _extra: ContextoExtra) => {
    await ejecutarPeticion(async (api) => {
      await api.player.pausePlayback(args.dispositivoId || '');
    });
    return { content: [{ type: 'text', text: '⏸️ Reproducción pausada' }] };
  },
};

const reanudar: Herramienta<{ dispositivoId: z.ZodOptional<z.ZodString> }> = {
  nombre: 'reanudar',
  descripcion: 'Reanuda la reproducción de Spotify',
  esquema: { dispositivoId: z.string().optional().describe('ID del dispositivo') },
  ejecutar: async (args, _extra: ContextoExtra) => {
    await ejecutarPeticion(async (api) => {
      await api.player.startResumePlayback(args.dispositivoId || '');
    });
    return { content: [{ type: 'text', text: '▶️ Reproducción reanudada' }] };
  },
};

const siguiente: Herramienta<{ dispositivoId: z.ZodOptional<z.ZodString> }> = {
  nombre: 'siguiente',
  descripcion: 'Salta a la siguiente canción',
  esquema: { dispositivoId: z.string().optional().describe('ID del dispositivo') },
  ejecutar: async (args, _extra: ContextoExtra) => {
    await ejecutarPeticion(async (api) => {
      await api.player.skipToNext(args.dispositivoId || '');
    });
    return { content: [{ type: 'text', text: '⏭️ Siguiente canción' }] };
  },
};

const anterior: Herramienta<{ dispositivoId: z.ZodOptional<z.ZodString> }> = {
  nombre: 'anterior',
  descripcion: 'Vuelve a la canción anterior',
  esquema: { dispositivoId: z.string().optional().describe('ID del dispositivo') },
  ejecutar: async (args, _extra: ContextoExtra) => {
    await ejecutarPeticion(async (api) => {
      await api.player.skipToPrevious(args.dispositivoId || '');
    });
    return { content: [{ type: 'text', text: '⏮️ Canción anterior' }] };
  },
};

const ajustarVolumen: Herramienta<{
  volumen: z.ZodNumber;
  dispositivoId: z.ZodOptional<z.ZodString>;
}> = {
  nombre: 'ajustarVolumen',
  descripcion: 'Ajusta el volumen de reproducción (0-100)',
  esquema: {
    volumen: z.number().min(0).max(100).describe('Volumen (0-100)'),
    dispositivoId: z.string().optional().describe('ID del dispositivo'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    await ejecutarPeticion(async (api) => {
      await api.player.setPlaybackVolume(args.volumen as MaxInt<100>, args.dispositivoId || '');
    });
    return { content: [{ type: 'text', text: `🔊 Volumen: ${args.volumen}%` }] };
  },
};

const activarAleatorio: Herramienta<{
  activar: z.ZodBoolean;
  dispositivoId: z.ZodOptional<z.ZodString>;
}> = {
  nombre: 'activarAleatorio',
  descripcion: 'Activa o desactiva el modo aleatorio',
  esquema: {
    activar: z.boolean().describe('true para activar, false para desactivar'),
    dispositivoId: z.string().optional().describe('ID del dispositivo'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    await ejecutarPeticion(async (api) => {
      await api.player.togglePlaybackShuffle(args.activar, args.dispositivoId || '');
    });
    return { content: [{ type: 'text', text: `🔀 Aleatorio ${args.activar ? 'activado' : 'desactivado'}` }] };
  },
};

const modoRepeticion: Herramienta<{
  modo: z.ZodEnum<['track', 'context', 'off']>;
  dispositivoId: z.ZodOptional<z.ZodString>;
}> = {
  nombre: 'modoRepeticion',
  descripcion: 'Configura el modo de repetición',
  esquema: {
    modo: z.enum(['track', 'context', 'off']).describe('track = repetir canción, context = repetir álbum/playlist, off = sin repetición'),
    dispositivoId: z.string().optional().describe('ID del dispositivo'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    await ejecutarPeticion(async (api) => {
      await api.player.setRepeatMode(args.modo, args.dispositivoId || '');
    });
    const modos = { track: 'canción', context: 'álbum/playlist', off: 'desactivado' };
    return { content: [{ type: 'text', text: `🔁 Repetición: ${modos[args.modo]}` }] };
  },
};

const cambiarDispositivo: Herramienta<{
  dispositivoId: z.ZodString;
  reproducir: z.ZodOptional<z.ZodBoolean>;
}> = {
  nombre: 'cambiarDispositivo',
  descripcion: 'Transfiere la reproducción a otro dispositivo',
  esquema: {
    dispositivoId: z.string().describe('ID del dispositivo destino'),
    reproducir: z.boolean().optional().describe('Iniciar reproducción en el nuevo dispositivo'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    await ejecutarPeticion(async (api) => {
      await api.player.transferPlayback([args.dispositivoId], args.reproducir ?? true);
    });
    return { content: [{ type: 'text', text: '📱 Reproducción transferida' }] };
  },
};

const saltarAPosicion: Herramienta<{
  posicionMs: z.ZodNumber;
  dispositivoId: z.ZodOptional<z.ZodString>;
}> = {
  nombre: 'saltarAPosicion',
  descripcion: 'Salta a una posición específica de la canción',
  esquema: {
    posicionMs: z.number().min(0).describe('Posición en milisegundos'),
    dispositivoId: z.string().optional().describe('ID del dispositivo'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    await ejecutarPeticion(async (api) => {
      await api.player.seekToPosition(args.posicionMs, args.dispositivoId || '');
    });
    const min = Math.floor(args.posicionMs / 60000);
    const seg = Math.floor((args.posicionMs % 60000) / 1000);
    return { content: [{ type: 'text', text: `⏩ Posición: ${min}:${seg.toString().padStart(2, '0')}` }] };
  },
};

const agregarACola: Herramienta<{
  uri: z.ZodOptional<z.ZodString>;
  tipo: z.ZodOptional<z.ZodEnum<['track', 'album', 'artist', 'playlist']>>;
  id: z.ZodOptional<z.ZodString>;
  dispositivoId: z.ZodOptional<z.ZodString>;
}> = {
  nombre: 'agregarACola',
  descripcion: 'Agrega contenido a la cola de reproducción',
  esquema: {
    uri: z.string().optional().describe('URI de Spotify'),
    tipo: z.enum(['track', 'album', 'artist', 'playlist']).optional().describe('Tipo de contenido'),
    id: z.string().optional().describe('ID del contenido'),
    dispositivoId: z.string().optional().describe('ID del dispositivo'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const spotifyUri = args.uri || (args.tipo && args.id ? `spotify:${args.tipo}:${args.id}` : undefined);

    if (!spotifyUri) {
      return { content: [{ type: 'text', text: 'Error: Proporciona un URI o tipo con ID', isError: true }] };
    }

    await ejecutarPeticion(async (api) => {
      await api.player.addItemToPlaybackQueue(spotifyUri, args.dispositivoId || '');
    });

    return { content: [{ type: 'text', text: `➕ Agregado a la cola` }] };
  },
};

export const herramientasReproduccion = [
  reproducir,
  pausar,
  reanudar,
  siguiente,
  anterior,
  ajustarVolumen,
  activarAleatorio,
  modoRepeticion,
  cambiarDispositivo,
  saltarAPosicion,
  agregarACola,
];
