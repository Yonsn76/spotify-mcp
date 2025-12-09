/**
 * Herramienta consolidada de biblioteca y playlists
 */
import { z } from 'zod';
import { ejecutarPeticion } from '../core/spotify.js';
const spotifyLibrary = {
    nombre: 'spotifyLibrary',
    descripcion: `Gestiona biblioteca y playlists del usuario. FLUJOS COMUNES:
- Guardar canción actual: Primero spotifyInfo(nowPlaying) para obtener ID, luego save(ids=[ID])
- Crear playlist con canciones: 1) createPlaylist(nombre="Mi Playlist"), 2) addToPlaylist(playlistId=ID_PLAYLIST, ids=[IDs de canciones])
- Ver playlists del usuario: spotifyInfo(playlists)
- Ver canciones de playlist: spotifyInfo(playlistTracks, id=PLAYLIST_ID)
NOTA: Los IDs de canciones se obtienen de spotifyInfo(search) o spotifyInfo(nowPlaying).`,
    esquema: {
        accion: z.enum(['save', 'remove', 'check', 'createPlaylist', 'addToPlaylist', 'removeFromPlaylist', 'deletePlaylist', 'renamePlaylist'])
            .describe('save=guardar en Me gusta, remove=quitar de Me gusta, check=verificar si guardada, createPlaylist, addToPlaylist, removeFromPlaylist, deletePlaylist, renamePlaylist'),
        ids: z.array(z.string()).optional().describe('Array de IDs de canciones (obtener de spotifyInfo search/nowPlaying)'),
        playlistId: z.string().optional().describe('ID de playlist (obtener de spotifyInfo playlists)'),
        nombre: z.string().optional().describe('Nombre para createPlaylist o renamePlaylist'),
        descripcion: z.string().optional().describe('Descripción de playlist (opcional)'),
        publica: z.boolean().optional().describe('Si la playlist es pública (default: false)'),
        posicion: z.number().optional().describe('Posición donde insertar canciones en playlist (0=inicio)'),
    },
    ejecutar: async (args, _extra) => {
        const { accion, ids, playlistId, nombre, descripcion, publica, posicion } = args;
        switch (accion) {
            case 'save': {
                if (!ids?.length)
                    return { content: [{ type: 'text', text: 'Error: Requiere ids' }] };
                await ejecutarPeticion(async (api) => {
                    await api.makeRequest('PUT', 'me/tracks', { ids });
                });
                return { content: [{ type: 'text', text: `💚 ${ids.length} canción(es) guardada(s)` }] };
            }
            case 'remove': {
                if (!ids?.length)
                    return { content: [{ type: 'text', text: 'Error: Requiere ids' }] };
                await ejecutarPeticion(async (api) => {
                    await api.makeRequest('DELETE', 'me/tracks', { ids });
                });
                return { content: [{ type: 'text', text: `🗑️ ${ids.length} canción(es) eliminada(s)` }] };
            }
            case 'check': {
                if (!ids?.length)
                    return { content: [{ type: 'text', text: 'Error: Requiere ids' }] };
                const resultados = await ejecutarPeticion(async (api) => await api.currentUser.tracks.hasSavedTracks(ids));
                const texto = ids.map((id, i) => `${id}: ${resultados[i] ? '✓ Guardada' : '✗ No guardada'}`).join('\n');
                return { content: [{ type: 'text', text: `# Estado\n\n${texto}` }] };
            }
            case 'createPlaylist': {
                if (!nombre)
                    return { content: [{ type: 'text', text: 'Error: Requiere nombre' }] };
                const resultado = await ejecutarPeticion(async (api) => {
                    const perfil = await api.currentUser.profile();
                    return await api.playlists.createPlaylist(perfil.id, { name: nombre, description: descripcion, public: publica ?? false });
                });
                return { content: [{ type: 'text', text: `✓ Playlist "${nombre}" creada\nID: ${resultado.id}` }] };
            }
            case 'addToPlaylist': {
                if (!playlistId || !ids?.length)
                    return { content: [{ type: 'text', text: 'Error: Requiere playlistId e ids' }] };
                const uris = ids.map((id) => id.startsWith('spotify:') ? id : `spotify:track:${id}`);
                await ejecutarPeticion(async (api) => { await api.playlists.addItemsToPlaylist(playlistId, uris, posicion); });
                return { content: [{ type: 'text', text: `➕ ${ids.length} canción(es) agregada(s)` }] };
            }
            case 'removeFromPlaylist': {
                if (!playlistId || !ids?.length)
                    return { content: [{ type: 'text', text: 'Error: Requiere playlistId e ids (URIs)' }] };
                const uris = ids.map((id) => id.startsWith('spotify:') ? id : `spotify:track:${id}`);
                await ejecutarPeticion(async (api) => {
                    await api.playlists.removeItemsFromPlaylist(playlistId, { tracks: uris.map((uri) => ({ uri })) });
                });
                return { content: [{ type: 'text', text: `🗑️ ${ids.length} canción(es) eliminada(s) de playlist` }] };
            }
            case 'deletePlaylist': {
                if (!playlistId)
                    return { content: [{ type: 'text', text: 'Error: Requiere playlistId' }] };
                await ejecutarPeticion(async (api) => {
                    await api.makeRequest('DELETE', `playlists/${playlistId}/followers`);
                });
                return { content: [{ type: 'text', text: `🗑️ Playlist eliminada` }] };
            }
            case 'renamePlaylist': {
                if (!playlistId)
                    return { content: [{ type: 'text', text: 'Error: Requiere playlistId' }] };
                if (!nombre)
                    return { content: [{ type: 'text', text: 'Error: Requiere nombre' }] };
                await ejecutarPeticion(async (api) => {
                    await api.makeRequest('PUT', `playlists/${playlistId}`, { name: nombre, description: descripcion });
                });
                return { content: [{ type: 'text', text: `✏️ Playlist renombrada a "${nombre}"` }] };
            }
            default:
                return { content: [{ type: 'text', text: '❌ Acción no válida' }] };
        }
    },
};
export const herramientasLibrary = [spotifyLibrary];
