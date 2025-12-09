import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
// Archivo para guardar tokens y credenciales en home del usuario
const ARCHIVO_TOKENS = path.join(os.homedir(), '.spotify-mcp-tokens.json');
function cargarDatosGuardados() {
    try {
        if (fs.existsSync(ARCHIVO_TOKENS)) {
            return JSON.parse(fs.readFileSync(ARCHIVO_TOKENS, 'utf8'));
        }
    }
    catch {
        // Si hay error, retornamos vacío
    }
    return {};
}
function guardarDatos(datos) {
    fs.writeFileSync(ARCHIVO_TOKENS, JSON.stringify(datos, null, 2), 'utf8');
}
export function cargarConfiguracion() {
    // Primero intentar cargar del archivo de tokens (configurado por LLM)
    const datosGuardados = cargarDatosGuardados();
    // Prioridad: archivo > env vars
    const clientId = datosGuardados.clientId || process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = datosGuardados.clientSecret || process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = datosGuardados.redirectUri || process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:8000/callback';
    if (!clientId || !clientSecret) {
        throw new Error('Credenciales no configuradas. Usa spotifyAuth con accion="configurar", clientId="tu_id", clientSecret="tu_secret"');
    }
    return {
        clientId,
        clientSecret,
        redirectUri,
        accessToken: datosGuardados.accessToken,
        refreshToken: datosGuardados.refreshToken,
    };
}
export function guardarConfiguracion(config) {
    // Guardar todo: credenciales + tokens
    const datosActuales = cargarDatosGuardados();
    guardarDatos({
        ...datosActuales,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: config.redirectUri,
        accessToken: config.accessToken,
        refreshToken: config.refreshToken,
    });
}
