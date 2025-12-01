<p align="center">
  <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2023/05/Spotify_Primary_Logo_RGB_Green.png" width="200" alt="Spotify Logo">
</p>

# Spotify MCP Server

Servidor MCP (Model Context Protocol) para controlar Spotify desde asistentes de IA como Kiro, Claude, etc.

## Instalacion

### 1. Clona y prepara el proyecto

```bash
git clone <repo>
cd spotify-mcp-server
npm install
npm run build
```

### 2. Obten credenciales de Spotify

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crea una nueva aplicacion
3. Copia el **Client ID** y **Client Secret**
4. En "Edit Settings", agrega `http://127.0.0.1:8080/callback` como Redirect URI

### 3. Configura el MCP

Agrega esto a tu `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "spotify": {
      "command": "npx",
      "args": ["tsx", "RUTA/AL/PROYECTO/src/index.ts"],
      "env": {
        "SPOTIFY_CLIENT_ID": "tu_client_id",
        "SPOTIFY_CLIENT_SECRET": "tu_client_secret",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:8080/callback"
      }
    }
  }
}
```

### 4. Autenticate

Usa la herramienta `ejecutarAutenticacion` desde tu asistente de IA. Esto abrira el navegador para iniciar sesion en Spotify.

## Herramientas

### Autenticacion
- `verificarEstado` - Verifica si estas autenticado
- `ejecutarAutenticacion` - Inicia el flujo OAuth automaticamente
- `iniciarAutenticacion` - Abre el navegador para auth manual
- `obtenerUrlAuth` - Obtiene la URL de auth
- `cerrarSesion` - Elimina los tokens

### Consultas
- `buscar` - Busca canciones, albumes, artistas o playlists
- `obtenerReproduccionActual` - Info de lo que esta sonando
- `obtenerMisPlaylists` - Lista tus playlists
- `obtenerCancionesPlaylist` - Canciones de una playlist
- `obtenerHistorial` - Canciones recientes
- `obtenerCancionesGuardadas` - Tus "Me gusta"
- `obtenerDispositivos` - Dispositivos disponibles
- `obtenerPerfil` - Tu perfil
- `obtenerTopCanciones` - Tus canciones mas escuchadas
- `obtenerTopArtistas` - Tus artistas mas escuchados
- `obtenerCancionesAlbum` - Canciones de un album
- `obtenerTopCancionesArtista` - Top tracks de un artista
- `obtenerEstadoReproduccion` - Estado actual
- `obtenerCola` - Cola de reproduccion

### Reproduccion
- `reproducir` - Reproduce contenido
- `pausar` / `reanudar` - Control de reproduccion
- `siguiente` / `anterior` - Navegacion
- `ajustarVolumen` - Volumen (0-100)
- `activarAleatorio` - Shuffle on/off
- `modoRepeticion` - Repeat (track/context/off)
- `cambiarDispositivo` - Transferir reproduccion
- `saltarAPosicion` - Saltar a posicion
- `agregarACola` - Agregar a cola

### Biblioteca
- `guardarCancion` / `eliminarCancion` - Gestionar Me gusta
- `verificarGuardadas` - Verificar si estan guardadas
- `crearPlaylist` - Crear playlist
- `agregarAPlaylist` / `eliminarDePlaylist` - Gestionar playlists

## Notas

- Los tokens se guardan en `~/.spotify-mcp-tokens.json`
- Necesitas Spotify Premium para controlar la reproduccion
- El redirect URI debe coincidir con el del Dashboard

## Licencia

MIT
