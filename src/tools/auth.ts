/**
 * Herramienta consolidada de autenticación
 */
import { z } from 'zod';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cargarConfiguracion,
  guardarConfiguracion,
  type ConfiguracionSpotify,
} from '../core/configuracion.js';
import { resetearApiSpotify } from '../core/spotify.js';
import type { ContextoExtra, Herramienta } from '../core/tipos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROYECTO_ROOT = path.join(__dirname, '../..');

const PERMISOS = [
  'user-read-private', 'user-read-email', 'user-read-playback-state',
  'user-modify-playback-state', 'user-read-currently-playing', 'playlist-read-private',
  'playlist-modify-private', 'playlist-modify-public', 'user-library-read',
  'user-library-modify', 'user-read-recently-played', 'user-top-read',
];

type AccionAuth = 'configurar' | 'verificar' | 'iniciar' | 'ejecutar' | 'urlAuth' | 'cerrar';

const spotifyAuth: Herramienta<{
  accion: z.ZodEnum<['configurar', 'verificar', 'iniciar', 'ejecutar', 'urlAuth', 'cerrar']>;
  clientId: z.ZodOptional<z.ZodString>;
  clientSecret: z.ZodOptional<z.ZodString>;
  redirectUri: z.ZodOptional<z.ZodString>;
}> = {
  nombre: 'spotifyAuth',
  descripcion: 'Gestiona la autenticación de Spotify: configurar credenciales, verificar estado, iniciar/ejecutar auth, cerrar sesión',
  esquema: {
    accion: z.enum(['configurar', 'verificar', 'iniciar', 'ejecutar', 'urlAuth', 'cerrar'])
      .describe('configurar=guardar credenciales, verificar=ver estado, iniciar=abrir navegador, ejecutar=completar OAuth, urlAuth=obtener URL, cerrar=logout'),
    clientId: z.string().optional().describe('Client ID (solo para configurar)'),
    clientSecret: z.string().optional().describe('Client Secret (solo para configurar)'),
    redirectUri: z.string().optional().describe('Redirect URI (solo para configurar, default: http://127.0.0.1:8000/callback)'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const { accion } = args;

    switch (accion) {
      case 'configurar': {
        if (!args.clientId || !args.clientSecret) {
          return { content: [{ type: 'text', text: '❌ Requiere clientId y clientSecret' }] };
        }
        let config: ConfiguracionSpotify;
        try { config = cargarConfiguracion(); } catch { config = { clientId: '', clientSecret: '', redirectUri: 'http://127.0.0.1:8000/callback' }; }
        config.clientId = args.clientId;
        config.clientSecret = args.clientSecret;
        config.redirectUri = args.redirectUri || 'http://127.0.0.1:8000/callback';
        config.accessToken = undefined;
        config.refreshToken = undefined;
        guardarConfiguracion(config);
        return { content: [{ type: 'text', text: `✓ Credenciales guardadas!\n\nClient ID: ${args.clientId.substring(0, 8)}...${args.clientId.slice(-4)}\n\nUsa accion="ejecutar" para conectar.` }] };
      }

      case 'verificar': {
        try {
          const config = cargarConfiguracion();
          const tieneCredenciales = !!(config.clientId && config.clientSecret);
          const tieneTokens = !!(config.accessToken && config.refreshToken && config.accessToken !== 'run-npm auth to get this');
          let estado = '# Estado de Autenticación\n\n';
          if (!tieneCredenciales) {
            estado += '❌ **Credenciales**: No configuradas\n\nUsa accion="configurar" con clientId y clientSecret.';
          } else {
            estado += `✓ **Credenciales**: Configuradas\n  - Client ID: ${config.clientId.substring(0, 8)}...${config.clientId.slice(-4)}\n\n`;
            estado += tieneTokens ? '✓ **Sesión**: Conectado' : '❌ **Sesión**: No conectado\n\nUsa accion="ejecutar" para conectar.';
          }
          return { content: [{ type: 'text', text: estado }] };
        } catch {
          return { content: [{ type: 'text', text: '❌ Sin configurar. Usa accion="configurar" primero.' }] };
        }
      }

      case 'iniciar': {
        try {
          const config = cargarConfiguracion();
          if (!config.clientId || !config.clientSecret) {
            return { content: [{ type: 'text', text: '❌ Credenciales no configuradas!' }] };
          }
          const params = new URLSearchParams({
            client_id: config.clientId, response_type: 'code', redirect_uri: config.redirectUri,
            scope: PERMISOS.join(' '), show_dialog: 'true',
          });
          const urlAuth = `https://accounts.spotify.com/authorize?${params.toString()}`;
          const open = await import('open');
          await open.default(urlAuth);
          return { content: [{ type: 'text', text: `🌐 Abriendo navegador...\n\nSi no se abre, visita:\n${urlAuth}\n\nLuego usa accion="ejecutar"` }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      }

      case 'ejecutar': {
        try {
          const config = cargarConfiguracion();
          if (!config.clientId || !config.clientSecret) {
            return { content: [{ type: 'text', text: '❌ Credenciales no configuradas!' }] };
          }
          return new Promise((resolve) => {
            const proceso = spawn('npm', ['run', 'auth'], { cwd: PROYECTO_ROOT, shell: true, env: { ...process.env } });
            let errorMsg = '';
            proceso.stderr.on('data', (data) => { errorMsg += data.toString(); });
            const timeout = setTimeout(() => { proceso.kill(); resolve({ content: [{ type: 'text', text: '⏱️ Timeout (2 min). Intenta de nuevo.' }] }); }, 120000);
            proceso.on('close', (code) => {
              clearTimeout(timeout);
              if (code === 0) {
                resetearApiSpotify(); // Forzar recarga de tokens
              }
              resolve({ content: [{ type: 'text', text: code === 0 ? '✅ ¡Autenticación completada!' : `❌ Error (código ${code})\n\n${errorMsg}` }] });
            });
            proceso.on('error', (err) => { clearTimeout(timeout); resolve({ content: [{ type: 'text', text: `❌ Error: ${err.message}` }] }); });
          });
        } catch (error) {
          return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      }

      case 'urlAuth': {
        try {
          const config = cargarConfiguracion();
          if (!config.clientId) return { content: [{ type: 'text', text: '❌ Credenciales no configuradas!' }] };
          const params = new URLSearchParams({ client_id: config.clientId, response_type: 'code', redirect_uri: config.redirectUri, scope: PERMISOS.join(' '), show_dialog: 'true' });
          return { content: [{ type: 'text', text: `# URL de Autorización\n\n${`https://accounts.spotify.com/authorize?${params.toString()}`}` }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      }

      case 'cerrar': {
        try {
          const config = cargarConfiguracion();
          config.accessToken = undefined;
          config.refreshToken = undefined;
          guardarConfiguracion(config);
          return { content: [{ type: 'text', text: '✓ Sesión cerrada. Usa accion="ejecutar" para reconectar.' }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      }

      default:
        return { content: [{ type: 'text', text: '❌ Acción no válida' }] };
    }
  },
};

export const herramientasAuth = [spotifyAuth];
