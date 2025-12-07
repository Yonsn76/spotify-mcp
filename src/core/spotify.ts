import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { cargarConfiguracion } from './configuracion.js';

let apiSpotify: SpotifyApi | null = null;

/** Resetea el cliente de Spotify para forzar recarga de tokens */
export function resetearApiSpotify(): void {
  apiSpotify = null;
}

export function obtenerApiSpotify(): SpotifyApi {
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

  apiSpotify = SpotifyApi.withClientCredentials(
    config.clientId,
    config.clientSecret,
  );

  return apiSpotify;
}

export async function ejecutarPeticion<T>(
  accion: (api: SpotifyApi) => Promise<T>,
): Promise<T> {
  try {
    const api = obtenerApiSpotify();
    return await accion(api);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    // Ignorar errores de parsing JSON que en realidad son operaciones exitosas
    if (
      mensaje.includes('Unexpected token') ||
      mensaje.includes('Unexpected non-whitespace character') ||
      mensaje.includes('Exponent part is missing a number in JSON')
    ) {
      return undefined as T;
    }
    throw error;
  }
}

export function formatearDuracion(ms: number): string {
  const minutos = Math.floor(ms / 60000);
  const segundos = ((ms % 60000) / 1000).toFixed(0);
  return `${minutos}:${segundos.padStart(2, '0')}`;
}
