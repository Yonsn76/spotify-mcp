import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARCHIVO_CONFIG = path.join(__dirname, '../../sp-credentials.json');

export interface ConfiguracionSpotify {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
}

export function cargarConfiguracion(): ConfiguracionSpotify {
  if (!fs.existsSync(ARCHIVO_CONFIG)) {
    throw new Error(
      `Archivo de configuración no encontrado en ${ARCHIVO_CONFIG}. Crea uno con clientId, clientSecret y redirectUri.`,
    );
  }

  try {
    const config = JSON.parse(fs.readFileSync(ARCHIVO_CONFIG, 'utf8'));
    if (!(config.clientId && config.clientSecret && config.redirectUri)) {
      throw new Error(
        'La configuración debe incluir clientId, clientSecret y redirectUri.',
      );
    }
    return config;
  } catch (error) {
    throw new Error(
      `Error al leer la configuración: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function guardarConfiguracion(config: ConfiguracionSpotify): void {
  fs.writeFileSync(ARCHIVO_CONFIG, JSON.stringify(config, null, 2), 'utf8');
}
