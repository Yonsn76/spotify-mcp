import { z } from 'zod';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cargarConfiguracion,
  guardarConfiguracion,
  type ConfiguracionSpotify,
} from '../core/configuracion.js';
import type { ContextoExtra, Herramienta } from '../core/tipos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROYECTO_ROOT = path.join(__dirname, '../..');

const configurarCredenciales: Herramienta<{
  clientId: z.ZodString;
  clientSecret: z.ZodString;
  redirectUri: z.ZodOptional<z.ZodString>;
}> = {
  nombre: 'configurarCredenciales',
  descripcion: 'Configura las credenciales de la API de Spotify (Client ID y Client Secret del Dashboard)',
  esquema: {
    clientId: z.string().describe('Tu Client ID de Spotify'),
    clientSecret: z.string().describe('Tu Client Secret de Spotify'),
    redirectUri: z.string().optional().describe('URI de redirección (por defecto: http://127.0.0.1:8000/callback)'),
  },
  ejecutar: async (args, _extra: ContextoExtra) => {
    const { clientId, clientSecret, redirectUri = 'http://127.0.0.1:8000/callback' } = args;
    try {
      let config: ConfiguracionSpotify;
      try {
        config = cargarConfiguracion();
      } catch {
        config = { clientId: '', clientSecret: '', redirectUri: 'http://127.0.0.1:8000/callback' };
      }
      config.clientId = clientId;
      config.clientSecret = clientSecret;
      config.redirectUri = redirectUri;
      config.accessToken = undefined;
      config.refreshToken = undefined;
      guardarConfiguracion(config);
      return {
        content: [{
          type: 'text',
          text: `✓ Credenciales guardadas!\n\nClient ID: ${clientId.substring(0, 8)}...${clientId.slice(-4)}\nRedirect URI: ${redirectUri}\n\nSiguiente paso: Usa "iniciarAutenticacion" para conectar con Spotify.`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      };
    }
  },
};


const verificarEstado: Herramienta<Record<string, never>> = {
  nombre: 'verificarEstado',
  descripcion: 'Verifica si las credenciales están configuradas y si estás autenticado',
  esquema: {},
  ejecutar: async (_args, _extra: ContextoExtra) => {
    try {
      const config = cargarConfiguracion();
      const tieneCredenciales = !!(config.clientId && config.clientSecret);
      const tieneTokens = !!(config.accessToken && config.refreshToken && config.accessToken !== 'run-npm auth to get this');
      let estado = '# Estado de Autenticación\n\n';
      if (!tieneCredenciales) {
        estado += '❌ **Credenciales**: No configuradas\n\nUsa "configurarCredenciales" para agregar tu Client ID y Secret.';
      } else {
        estado += `✓ **Credenciales**: Configuradas\n  - Client ID: ${config.clientId.substring(0, 8)}...${config.clientId.slice(-4)}\n  - Redirect URI: ${config.redirectUri}\n\n`;
        estado += tieneTokens
          ? '✓ **Sesión**: Conectado\n\n¡Listo para usar Spotify!'
          : '❌ **Sesión**: No conectado\n\nUsa "ejecutarAutenticacion" para conectar.';
      }
      return { content: [{ type: 'text', text: estado }] };
    } catch {
      return {
        content: [{
          type: 'text',
          text: '❌ **Estado**: Sin configurar\n\nNo hay archivo de configuración. Usa "configurarCredenciales" primero.',
        }],
      };
    }
  },
};

const iniciarAutenticacion: Herramienta<Record<string, never>> = {
  nombre: 'iniciarAutenticacion',
  descripcion: 'Inicia el proceso de autenticación con Spotify. Abre el navegador para iniciar sesión.',
  esquema: {},
  ejecutar: async (_args, _extra: ContextoExtra) => {
    try {
      const config = cargarConfiguracion();
      if (!config.clientId || !config.clientSecret) {
        return {
          content: [{ type: 'text', text: '❌ Credenciales no configuradas!\n\nUsa "configurarCredenciales" primero.' }],
        };
      }
      const permisos = [
        'user-read-private', 'user-read-email', 'user-read-playback-state',
        'user-modify-playback-state', 'user-read-currently-playing', 'playlist-read-private',
        'playlist-modify-private', 'playlist-modify-public', 'user-library-read',
        'user-library-modify', 'user-read-recently-played', 'user-top-read',
      ];
      const params = new URLSearchParams({
        client_id: config.clientId,
        response_type: 'code',
        redirect_uri: config.redirectUri,
        scope: permisos.join(' '),
        show_dialog: 'true',
      });
      const urlAuth = `https://accounts.spotify.com/authorize?${params.toString()}`;
      const puerto = new URL(config.redirectUri).port || '80';
      const open = await import('open');
      await open.default(urlAuth);
      return {
        content: [{
          type: 'text',
          text: `🌐 Abriendo navegador...\n\nSi no se abre, visita:\n${urlAuth}\n\nDespués ejecuta en terminal:\n\`\`\`\nnpm run auth\n\`\`\`\n\nEscuchando en puerto ${puerto}.`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      };
    }
  },
};


const ejecutarAutenticacion: Herramienta<Record<string, never>> = {
  nombre: 'ejecutarAutenticacion',
  descripcion: 'Ejecuta npm run auth automáticamente para completar la autenticación OAuth con Spotify',
  esquema: {},
  ejecutar: async (_args, _extra: ContextoExtra) => {
    try {
      const config = cargarConfiguracion();
      if (!config.clientId || !config.clientSecret) {
        return {
          content: [{ type: 'text', text: '❌ Credenciales no configuradas!\n\nUsa "configurarCredenciales" primero.' }],
        };
      }
      return new Promise((resolve) => {
        const proceso = spawn('npm', ['run', 'auth'], {
          cwd: PROYECTO_ROOT,
          shell: true,
          env: { ...process.env },
        });
        let salida = '';
        let errorMsg = '';
        let timeout: NodeJS.Timeout;
        proceso.stdout.on('data', (data) => { salida += data.toString(); });
        proceso.stderr.on('data', (data) => { errorMsg += data.toString(); });
        timeout = setTimeout(() => {
          proceso.kill();
          resolve({
            content: [{
              type: 'text',
              text: '⏱️ Timeout: La autenticación tardó demasiado (2 min).\n\nIntenta de nuevo y completa el login más rápido.',
            }],
          });
        }, 120000);
        proceso.on('close', (code) => {
          clearTimeout(timeout);
          if (code === 0) {
            resolve({
              content: [{ type: 'text', text: '✅ ¡Autenticación completada!\n\nYa puedes usar Spotify.' }],
            });
          } else {
            resolve({
              content: [{ type: 'text', text: `❌ Error (código ${code})\n\n${errorMsg || salida}` }],
            });
          }
        });
        proceso.on('error', (err) => {
          clearTimeout(timeout);
          resolve({
            content: [{ type: 'text', text: `❌ Error al ejecutar: ${err.message}` }],
          });
        });
      });
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      };
    }
  },
};

const obtenerUrlAuth: Herramienta<Record<string, never>> = {
  nombre: 'obtenerUrlAuth',
  descripcion: 'Obtiene la URL de autorización sin abrir el navegador',
  esquema: {},
  ejecutar: async (_args, _extra: ContextoExtra) => {
    try {
      const config = cargarConfiguracion();
      if (!config.clientId) {
        return { content: [{ type: 'text', text: '❌ Credenciales no configuradas!' }] };
      }
      const permisos = [
        'user-read-private', 'user-read-email', 'user-read-playback-state',
        'user-modify-playback-state', 'user-read-currently-playing', 'playlist-read-private',
        'playlist-modify-private', 'playlist-modify-public', 'user-library-read',
        'user-library-modify', 'user-read-recently-played', 'user-top-read',
      ];
      const params = new URLSearchParams({
        client_id: config.clientId,
        response_type: 'code',
        redirect_uri: config.redirectUri,
        scope: permisos.join(' '),
        show_dialog: 'true',
      });
      return {
        content: [{
          type: 'text',
          text: `# URL de Autorización\n\nVisita:\n\n${`https://accounts.spotify.com/authorize?${params.toString()}`}\n\nLuego ejecuta \`npm run auth\` en terminal.`,
        }],
      };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  },
};

const cerrarSesion: Herramienta<Record<string, never>> = {
  nombre: 'cerrarSesion',
  descripcion: 'Cierra la sesión de Spotify (elimina los tokens)',
  esquema: {},
  ejecutar: async (_args, _extra: ContextoExtra) => {
    try {
      const config = cargarConfiguracion();
      config.accessToken = undefined;
      config.refreshToken = undefined;
      guardarConfiguracion(config);
      return {
        content: [{ type: 'text', text: '✓ Sesión cerrada. Tus credenciales siguen guardadas.\n\nUsa "iniciarAutenticacion" para conectar de nuevo.' }],
      };
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  },
};

export const herramientasAuth = [
  configurarCredenciales,
  verificarEstado,
  iniciarAutenticacion,
  ejecutarAutenticacion,
  obtenerUrlAuth,
  cerrarSesion,
];
