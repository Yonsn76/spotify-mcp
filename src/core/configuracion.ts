import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Archivo para guardar tokens en home del usuario
const ARCHIVO_TOKENS = path.join(os.homedir(), '.spotify-mcp-tokens.json');

export interface ConfiguracionSpotify {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
}

interface TokensGuardados {
  accessToken?: string;
  refreshToken?: string;
}

function cargarTokens(): TokensGuardados {
  try {
    if (fs.existsSync(ARCHIVO_TOKENS)) {
      return JSON.parse(fs.readFileSync(ARCHIVO_TOKENS, 'utf8'));
    }
  } catch {
    // Si hay error, retornamos vacío
  }
  return {};
}

function guardarTokens(tokens: TokensGuardados): void {
  fs.writeFileSync(ARCHIVO_TOKENS, JSON.stringify(tokens, null, 2), 'utf8');
}

export function cargarConfiguracion(): ConfiguracionSpotify {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:8080/callback';

  if (!clientId || !clientSecret) {
    throw new Error(
      'Faltan SPOTIFY_CLIENT_ID y/o SPOTIFY_CLIENT_SECRET en las variables de entorno del mcp.json'
    );
  }

  const tokens = cargarTokens();

  return {
    clientId,
    clientSecret,
    redirectUri,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export function guardarConfiguracion(config: ConfiguracionSpotify): void {
  guardarTokens({
    accessToken: config.accessToken,
    refreshToken: config.refreshToken,
  });
}
