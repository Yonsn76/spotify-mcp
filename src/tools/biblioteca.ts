import { z } from 'zod';
import { ejecutarPeticion } from '../core/spotify.js';
import type { ContextoExtra, Herramienta } from '../core/tipos.js';

const guardarCancion: Herramienta<{ ids: z.ZodArray<z.ZodString> }> = {
  nombre: 'guardarCancion',
  descripcion: 'Guarda canciones en tu biblioteca (Me gusta)',
  esquema: {
    ids: z.array(z.string()).describe('IDs de las canciones a guardar'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    await ejecutarPeticion(async (api) => {
      await api.currentUser.tracks.saveTracks(args.ids);
    });
    return { content: [{ type: 'text', text: `💚 ${args.ids.length} canción(es) guardada(s)` }] };
  },
};

const eliminarCancion: Herramienta<{ ids: z.ZodArray<z.ZodString> }> = {
  nombre: 'eliminarCancion',
  descripcion: 'Elimina canciones de tu biblioteca',
  esquema: {
    ids: z.array(z.string()).describe('IDs de las canciones a eliminar'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    await ejecutarPeticion(async (api) => {
      await api.currentUser.tracks.removeSavedTracks(args.ids);
    });
    return { content: [{ type: 'text', text: `🗑️ ${args.ids.length} canción(es) eliminada(s)` }] };
  },
};

const verificarGuardadas: Herramienta<{ ids: z.ZodArray<z.ZodString> }> = {
  nombre: 'verificarGuardadas',
  descripcion: 'Verifica si las canciones están en tu biblioteca',
  esquema: {
    ids: z.array(z.string()).describe('IDs de las canciones a verificar'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const resultados = await ejecutarPeticion(async (api) => {
      return await api.currentUser.tracks.hasSavedTracks(args.ids);
    });

    const texto = args.ids
      .map((id, i) => `${id}: ${resultados[i] ? '✓ Guardada' : '✗ No guardada'}`)
      .join('\n');

    return { content: [{ type: 'text', text: `# Estado de Canciones\n\n${texto}` }] };
  },
};

const crearPlaylist: Herramienta<{
  nombre: z.ZodString;
  descripcion: z.ZodOptional<z.ZodString>;
  publica: z.ZodOptional<z.ZodBoolean>;
}> = {
  nombre: 'crearPlaylist',
  descripcion: 'Crea una nueva playlist',
  esquema: {
    nombre: z.string().describe('Nombre de la playlist'),
    descripcion: z.string().optional().describe('Descripción de la playlist'),
    publica: z.boolean().optional().describe('Si la playlist es pública'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const resultado = await ejecutarPeticion(async (api) => {
      const perfil = await api.currentUser.profile();
      return await api.playlists.createPlaylist(perfil.id, {
        name: args.nombre,
        description: args.descripcion,
        public: args.publica ?? false,
      });
    });

    return { content: [{ type: 'text', text: `✓ Playlist "${args.nombre}" creada\nID: ${resultado.id}` }] };
  },
};

const agregarAPlaylist: Herramienta<{
  playlistId: z.ZodString;
  cancionIds: z.ZodArray<z.ZodString>;
  posicion: z.ZodOptional<z.ZodNumber>;
}> = {
  nombre: 'agregarAPlaylist',
  descripcion: 'Agrega canciones a una playlist',
  esquema: {
    playlistId: z.string().describe('ID de la playlist'),
    cancionIds: z.array(z.string()).describe('IDs de las canciones'),
    posicion: z.number().nonnegative().optional().describe('Posición donde insertar'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const uris = args.cancionIds.map((id) => `spotify:track:${id}`);

    await ejecutarPeticion(async (api) => {
      await api.playlists.addItemsToPlaylist(args.playlistId, uris, args.posicion);
    });

    return { content: [{ type: 'text', text: `➕ ${args.cancionIds.length} canción(es) agregada(s) a la playlist` }] };
  },
};

const eliminarDePlaylist: Herramienta<{
  playlistId: z.ZodString;
  uris: z.ZodArray<z.ZodString>;
}> = {
  nombre: 'eliminarDePlaylist',
  descripcion: 'Elimina canciones de una playlist',
  esquema: {
    playlistId: z.string().describe('ID de la playlist'),
    uris: z.array(z.string()).describe('URIs de las canciones (formato: spotify:track:ID)'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    await ejecutarPeticion(async (api) => {
      await api.playlists.removeItemsFromPlaylist(args.playlistId, {
        tracks: args.uris.map((uri) => ({ uri })),
      });
    });

    return { content: [{ type: 'text', text: `🗑️ ${args.uris.length} canción(es) eliminada(s) de la playlist` }] };
  },
};

export const herramientasBiblioteca = [
  guardarCancion,
  eliminarCancion,
  verificarGuardadas,
  crearPlaylist,
  agregarAPlaylist,
  eliminarDePlaylist,
];
