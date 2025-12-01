# Spotify MCP Server 🎵

Servidor MCP (Model Context Protocol) para controlar Spotify desde asistentes de IA como Kiro, Claude, etc.

## Instalación

### 1. Clona y prepara el proyecto

```bash
git clone <repo>
cd spotify-mcp-server
npm install
npm run build
```

### 2. Obtén credenciales de Spotify

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crea una nueva aplicación
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

### 4. Autentícate

Usa la herramienta `ejecutarAutenticacion` desde tu asistente de IA. Esto abrirá el navegador para iniciar sesión en Spotify.

## Herramientas

### Autenticación
- `verificarEstado` - Verifica si estás autenticado
- `ejecutarAutenticacion` - Inicia el flujo OAuth automáticamente
- `iniciarAutenticacion` - Abre el navegador para auth manual
- `obtenerUrlAuth` - Obtiene la URL de auth
- `cerrarSesion` - Elimina los tokens

### Consultas
- `buscar` - Busca canciones, álbumes, artistas o playlists
- `obtenerReproduccionActual` - Info de lo que está sonando
- `obtenerMisPlaylists` - Lista tus playlists
- `obtenerCancionesPlaylist` - Canciones de una playlist
- `obtenerHistorial` - Canciones recientes
- `obtenerCancionesGuardadas` - Tus "Me gusta"
- `obtenerDispositivos` - Dispositivos disponibles
- `obtenerPerfil` - Tu perfil
- `obtenerTopCanciones` - Tus canciones más escuchadas
- `obtenerTopArtistas` - Tus artistas más escuchados
- `obtenerCancionesAlbum` - Canciones de un álbum
- `obtenerTopCancionesArtista` - Top tracks de un artista
- `obtenerEstadoReproduccion` - Estado actual
- `obtenerCola` - Cola de reproducción

### Reproducción
- `reproducir` - Reproduce contenido
- `pausar` / `reanudar` - Control de reproducción
- `siguiente` / `anterior` - Navegación
- `ajustarVolumen` - Volumen (0-100)
- `activarAleatorio` - Shuffle on/off
- `modoRepeticion` - Repeat (track/context/off)
- `cambiarDispositivo` - Transferir reproducción
- `saltarAPosicion` - Saltar a posición
- `agregarACola` - Agregar a cola

### Biblioteca
- `guardarCancion` / `eliminarCancion` - Gestionar Me gusta
- `verificarGuardadas` - Verificar si están guardadas
- `crearPlaylist` - Crear playlist
- `agregarAPlaylist` / `eliminarDePlaylist` - Gestionar playlists

## Notas

- Los tokens se guardan en `~/.spotify-mcp-tokens.json`
- Necesitas Spotify Premium para controlar la reproducción
- El redirect URI debe coincidir con el del Dashboard

## Licencia

MIT
