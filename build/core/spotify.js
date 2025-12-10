import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { cargarConfiguracion } from './configuracion.js';
let apiSpotify = null;
/** Resetea el cliente de Spotify para forzar recarga de tokens */
export function resetearApiSpotify() {
    apiSpotify = null;
}
export function obtenerApiSpotify() {
    if (apiSpotify) {
        return apiSpotify;
    }
    const config = cargarConfiguracion();
    if (config.accessToken && config.refreshToken) {
        const tokenAcceso = {
            access_token: config.accessToken,
            token_type: 'Bearer',
            expires_in: 3600 * 24 * 30,
            refresh_token: config.refreshToken,
        };
        apiSpotify = SpotifyApi.withAccessToken(config.clientId, tokenAcceso);
        return apiSpotify;
    }
    apiSpotify = SpotifyApi.withClientCredentials(config.clientId, config.clientSecret);
    return apiSpotify;
}
export async function ejecutarPeticion(accion) {
    try {
        const api = obtenerApiSpotify();
        return await accion(api);
    }
    catch (error) {
        const mensaje = error instanceof Error ? error.message : String(error);
        // Ignorar errores de parsing JSON que en realidad son operaciones exitosas
        if (mensaje.includes('Unexpected token') ||
            mensaje.includes('Unexpected non-whitespace character') ||
            mensaje.includes('Exponent part is missing a number in JSON')) {
            return undefined;
        }
        throw error;
    }
}
/** Ejecuta petición de player con manejo especial para cuando no hay reproducción activa */
export async function ejecutarPeticionPlayer(accion, accionNombre) {
    try {
        const api = obtenerApiSpotify();
        const data = await accion(api);
        return { ok: true, data };
    }
    catch (error) {
        const mensaje = error instanceof Error ? error.message : String(error);
        // Ignorar errores de parsing JSON que en realidad son operaciones exitosas
        if (mensaje.includes('Unexpected token') ||
            mensaje.includes('Unexpected non-whitespace character') ||
            mensaje.includes('Exponent part is missing a number in JSON')) {
            return { ok: true, data: undefined };
        }
        // Errores comunes de Spotify con guías de siguiente paso
        if (mensaje.includes('No active device') || mensaje.includes('Player command failed: No active device')) {
            return { ok: false, error: '📵 No hay dispositivo activo. SIGUIENTE: 1) Usa spotifyInfo(accion="devices") para obtener lista de dispositivos. 2) Si hay dispositivos, usa spotifyPlayer(accion="transfer", dispositivo="ID_DEL_DISPOSITIVO") para activar uno. 3) Si no hay dispositivos, usa spotifyPlayer(accion="openApp") para abrir Spotify, espera a que cargue, luego repite desde el paso 1. 4) Si transfer falla, pide al usuario que reproduzca algo manualmente en Spotify para activar la sesion.' };
        }
        if (mensaje.includes('Restriction violated') || mensaje.includes('PREMIUM_REQUIRED')) {
            return { ok: false, error: '⭐ Se requiere Spotify Premium para controlar reproducción. El usuario necesita una cuenta Premium para usar play/pause/next/prev/volume/etc.' };
        }
        if (mensaje.includes('Not found') || mensaje.includes('404')) {
            return { ok: false, error: `❌ No se encontró el recurso para ${accionNombre}. SIGUIENTE: Verifica que el ID sea correcto usando spotifyInfo(accion="search").` };
        }
        if (mensaje.includes('Unauthorized') || mensaje.includes('401') || mensaje.includes('access token')) {
            return { ok: false, error: '🔐 Sesión expirada o no autenticado. SIGUIENTE: Usa spotifyAuth(accion="verificar") para ver estado, luego spotifyAuth(accion="ejecutar") para reconectar.' };
        }
        return { ok: false, error: `❌ Error en ${accionNombre}: ${mensaje}` };
    }
}
export function formatearDuracion(ms) {
    const minutos = Math.floor(ms / 60000);
    const segundos = ((ms % 60000) / 1000).toFixed(0);
    return `${minutos}:${segundos.padStart(2, '0')}`;
}
