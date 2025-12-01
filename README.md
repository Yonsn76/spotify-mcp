<p align="center">
  <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2023/05/Spotify_Primary_Logo_RGB_Green.png" width="200" alt="Spotify Logo">
</p>

# Spotify MCP Server

Servidor MCP (Model Context Protocol) para controlar Spotify desde asistentes de IA como Claude, Cursor, etc.

## Instalación

### 1. Clona y prepara el proyecto

```bash
git clone https://github.com/Yonsn76/spotify-mcp.git
cd spotify-mcp
npm install
```

### 2. Obtén credenciales de Spotify

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crea una nueva aplicación
3. Copia el **Client ID** y **Client Secret**
4. En "Edit Settings", agrega `http://127.0.0.1:8000/callback` como Redirect URI

### 3. Configura el MCP

Agrega esto a la configuración de tu MCP (ej: `mcp.json`):

```json
{
  "mcpServers": {
    "spotify": {
      "command": "npx",
      "args": [
        "tsx",
        "RUTA/AL/PROYECTO/src/index.ts"
      ],
      "env": {
        "SPOTIFY_CLIENT_ID": "tu_client_id",
        "SPOTIFY_CLIENT_SECRET": "tu_client_secret",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:8000/callback"
      }
    }
  }
}
```

**Ejemplo real:**
```json
{
  "mcpServers": {
    "spotify": {
      "command": "npx",
      "args": [
        "tsx",
        "C:/Users/TuUsuario/Desktop/MCP/spotify-mcp-server/src/index.ts"
      ],
      "env": {
        "SPOTIFY_CLIENT_ID": "a787a309dbc54a64a4ca340258731cb9",
        "SPOTIFY_CLIENT_SECRET": "tu_client_secret_aqui",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:8000/callback"
      }
    }
  }
}
```

### 4. Autentícate

Usa la herramienta `ejecutarAutenticacion` desde tu asistente de IA. Esto abrirá el navegador para iniciar sesión en Spotify.

## Herramientas Disponibles

### Autenticación
| Herramienta | Descripción |
|-------------|-------------|
| `configurarCredenciales` | Configura Client ID y Client Secret |
| `verificarEstado` | Verifica si estás autenticado |
| `ejecutarAutenticacion` | Inicia el flujo OAuth automáticamente |
| `iniciarAutenticacion` | Abre el navegador para auth manual |
| `obtenerUrlAuth` | Obtiene la URL de autorización |
| `cerrarSesion` | Elimina los tokens guardados |

### Consultas
| Herramienta | Descripción |
|-------------|-------------|
| `buscar` | Busca canciones, álbumes, artistas o playlists |
| `obtenerReproduccionActual` | Info de lo que está sonando |
| `obtenerMisPlaylists` | Lista tus playlists |
| `obtenerCancionesPlaylist` | Canciones de una playlist |
| `obtenerHistorial` | Canciones reproducidas recientemente |
| `obtenerCancionesGuardadas` | Tus canciones con "Me gusta" |
| `obtenerDispositivos` | Dispositivos disponibles |
| `obtenerPerfil` | Tu perfil de Spotify |
| `obtenerTopCanciones` | Tus canciones más escuchadas |
| `obtenerTopArtistas` | Tus artistas más escuchados |
| `obtenerCancionesAlbum` | Canciones de un álbum |
| `obtenerTopCancionesArtista` | Top tracks de un artista |
| `obtenerEstadoReproduccion` | Estado actual (shuffle, repeat, volumen) |
| `obtenerCola` | Cola de reproducción actual |

### Reproducción
| Herramienta | Descripción |
|-------------|-------------|
| `reproducir` | Reproduce una canción, álbum, artista o playlist |
| `pausar` | Pausa la reproducción |
| `reanudar` | Reanuda la reproducción |
| `siguiente` | Salta a la siguiente canción |
| `anterior` | Vuelve a la canción anterior |
| `ajustarVolumen` | Ajusta el volumen (0-100) |
| `activarAleatorio` | Activa/desactiva modo aleatorio |
| `modoRepeticion` | Configura repetición (track/context/off) |
| `cambiarDispositivo` | Transfiere reproducción a otro dispositivo |
| `saltarAPosicion` | Salta a una posición específica en ms |
| `agregarACola` | Agrega contenido a la cola |

### Biblioteca
| Herramienta | Descripción |
|-------------|-------------|
| `guardarCancion` | Guarda canciones en "Me gusta" |
| `eliminarCancion` | Elimina canciones de "Me gusta" |
| `verificarGuardadas` | Verifica si canciones están guardadas |
| `crearPlaylist` | Crea una nueva playlist |
| `agregarAPlaylist` | Agrega canciones a una playlist |
| `eliminarDePlaylist` | Elimina canciones de una playlist |

## Notas Importantes

- **Tokens**: Se guardan automáticamente en `~/.spotify-mcp-tokens.json`
- **Spotify Premium**: Necesario para controlar la reproducción
- **Redirect URI**: Debe ser exactamente `http://127.0.0.1:8000/callback` tanto en el Dashboard como en la configuración
- **Puerto 8000**: Si está ocupado, el servidor de autenticación fallará. Cierra cualquier proceso que lo use.

## Solución de Problemas

### Error "INVALID_CLIENT"
- Verifica que el Client ID y Client Secret sean correctos
- Asegúrate de que el Redirect URI en el Dashboard sea `http://127.0.0.1:8000/callback`

### Error "EADDRINUSE" (puerto ocupado)
El puerto 8000 está en uso. En Windows, ejecuta:
```cmd
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### No se reproduce música
- Asegúrate de tener Spotify abierto en algún dispositivo
- Verifica que tengas Spotify Premium
