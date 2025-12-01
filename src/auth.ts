#!/usr/bin/env node

/**
 * Script de autenticación OAuth con Spotify
 * Ejecutar con: npm run auth
 */

import crypto from 'node:crypto';
import http from 'node:http';
import { URL } from 'node:url';
import open from 'open';
import { cargarConfiguracion, guardarConfiguracion } from './core/configuracion.js';

/** Genera una cadena aleatoria para el state de OAuth */
function generarCadenaAleatoria(longitud: number): string {
  const array = new Uint8Array(longitud);
  crypto.getRandomValues(array);
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(array).map((b) => caracteres.charAt(b % 62)).join('');
}

/** Codifica en base64 */
function codificarBase64(str: string): string {
  return Buffer.from(str).toString('base64');
}

/** Intercambia el código de autorización por tokens */
async function intercambiarCodigoPorToken(codigo: string): Promise<{ access_token: string; refresh_token: string }> {
  const config = cargarConfiguracion();
  const urlToken = 'https://accounts.spotify.com/api/token';
  const authHeader = `Basic ${codificarBase64(`${config.clientId}:${config.clientSecret}`)}`;

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', codigo);
  params.append('redirect_uri', config.redirectUri);

  const respuesta = await fetch(urlToken, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!respuesta.ok) {
    const error = await respuesta.text();
    throw new Error(`Error al obtener token: ${error}`);
  }

  const datos = await respuesta.json();
  return { access_token: datos.access_token, refresh_token: datos.refresh_token };
}

/** Inicia el flujo de autenticación OAuth */
async function autenticarSpotify(): Promise<void> {
  const config = cargarConfiguracion();
  const uriRedireccion = new URL(config.redirectUri);

  if (uriRedireccion.hostname !== 'localhost' && uriRedireccion.hostname !== '127.0.0.1') {
    console.error('Error: La URI de redirección debe usar localhost');
    process.exit(1);
  }

  const puerto = uriRedireccion.port || '80';
  const rutaCallback = uriRedireccion.pathname || '/callback';
  const state = generarCadenaAleatoria(16);

  const permisos = [
    'user-read-private', 'user-read-email', 'user-read-playback-state',
    'user-modify-playback-state', 'user-read-currently-playing', 'playlist-read-private',
    'playlist-modify-private', 'playlist-modify-public', 'user-library-read',
    'user-library-modify', 'user-read-recently-played', 'user-top-read',
  ];

  const paramsAuth = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    scope: permisos.join(' '),
    state,
    show_dialog: 'true',
  });

  const urlAutorizacion = `https://accounts.spotify.com/authorize?${paramsAuth.toString()}`;

  const promesaAuth = new Promise<void>((resolve, reject) => {
    const servidor = http.createServer(async (req, res) => {
      if (!req.url) return res.end('Sin URL');

      const urlReq = new URL(req.url, `http://localhost:${puerto}`);
      if (urlReq.pathname !== rutaCallback) {
        res.writeHead(404);
        return res.end();
      }

      const codigo = urlReq.searchParams.get('code');
      const stateRetornado = urlReq.searchParams.get('state');
      const error = urlReq.searchParams.get('error');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

      if (error) {
        console.error(`Error de autorización: ${error}`);
        res.end('<html><body><h1>❌ Error</h1><p>Cierra esta ventana e intenta de nuevo.</p></body></html>');
        servidor.close();
        return reject(new Error(error));
      }

      if (stateRetornado !== state) {
        console.error('Error: State no coincide');
        res.end('<html><body><h1>❌ Error de verificación</h1></body></html>');
        servidor.close();
        return reject(new Error('State mismatch'));
      }

      if (!codigo) {
        console.error('Sin código de autorización');
        res.end('<html><body><h1>❌ Sin código</h1></body></html>');
        servidor.close();
        return reject(new Error('No code'));
      }

      try {
        const tokens = await intercambiarCodigoPorToken(codigo);
        config.accessToken = tokens.access_token;
        config.refreshToken = tokens.refresh_token;
        guardarConfiguracion(config);

        res.end('<html><body><h1>✅ ¡Autenticación exitosa!</h1><p>Puedes cerrar esta ventana.</p></body></html>');
        console.log('✅ Autenticación completada. Token guardado.');
        servidor.close();
        resolve();
      } catch (err) {
        console.error('Error al intercambiar token:', err);
        res.end('<html><body><h1>❌ Error</h1><p>No se pudo obtener el token.</p></body></html>');
        servidor.close();
        reject(err);
      }
    });

    servidor.listen(Number.parseInt(puerto), '127.0.0.1', () => {
      console.log(`🎧 Escuchando en puerto ${puerto}...`);
      console.log('🌐 Abriendo navegador...');
      open(urlAutorizacion).catch(() => {
        console.log('No se pudo abrir el navegador. Visita:');
        console.log(urlAutorizacion);
      });
    });

    servidor.on('error', (err) => {
      console.error(`Error del servidor: ${err.message}`);
      reject(err);
    });
  });

  await promesaAuth;
}

console.log('🎵 Iniciando autenticación con Spotify...');
autenticarSpotify()
  .then(() => {
    console.log('✅ ¡Listo!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
