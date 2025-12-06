/**
 * Servidor MCP para controlar Spotify
 * Versión optimizada con herramientas consolidadas (4 herramientas en lugar de 39)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { herramientasAuth } from './tools/auth.js';
import { herramientasPlayer } from './tools/player.js';
import { herramientasInfo } from './tools/info.js';
import { herramientasLibrary } from './tools/library.js';

const servidor = new McpServer({
  name: 'spotify-mcp',
  version: '2.0.0',
});

const todasLasHerramientas = [
  ...herramientasAuth,
  ...herramientasPlayer,
  ...herramientasInfo,
  ...herramientasLibrary,
];

todasLasHerramientas.forEach((herramienta) => {
  servidor.tool(
    herramienta.nombre,
    herramienta.descripcion,
    herramienta.esquema,
    herramienta.ejecutar,
  );
});

async function iniciar() {
  const transporte = new StdioServerTransport();
  await servidor.connect(transporte);
}

iniciar().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
