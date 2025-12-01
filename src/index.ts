/**
 * Servidor MCP para controlar Spotify
 * Punto de entrada principal que registra todas las herramientas
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { herramientasAuth } from './tools/autenticacion.js';
import { herramientasBiblioteca } from './tools/biblioteca.js';
import { herramientasConsultas } from './tools/consultas.js';
import { herramientasReproduccion } from './tools/reproduccion.js';

/** Configuración del servidor MCP */
const servidor = new McpServer({
  name: 'spotify-mcp',
  version: '1.0.0',
});

/** Registra todas las herramientas en el servidor */
const todasLasHerramientas = [
  ...herramientasAuth,
  ...herramientasConsultas,
  ...herramientasReproduccion,
  ...herramientasBiblioteca,
];

todasLasHerramientas.forEach((herramienta) => {
  servidor.tool(
    herramienta.nombre,
    herramienta.descripcion,
    herramienta.esquema,
    herramienta.ejecutar,
  );
});

/** Inicia el servidor con transporte stdio */
async function iniciar() {
  const transporte = new StdioServerTransport();
  await servidor.connect(transporte);
}

iniciar().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
