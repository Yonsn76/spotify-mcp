<p align="center">
  <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2023/05/Spotify_Primary_Logo_RGB_Green.png" width="200" alt="Spotify Logo">
</p>

# Spotify MCP Server

Servidor MCP (Model Context Protocol) para controlar Spotify desde asistentes de IA como Claude, Cursor, Kiro, VS Code, etc.

## Requisitos

- Node.js 18+
- Cuenta de Spotify (Premium requerido para control de reproducción)
- Credenciales de la API de Spotify

## Configuración Inicial

### 1. Clonar el proyecto

```bash
git clone https://github.com/Yonsn76/spotify-mcp.git
cd spotify-mcp
npm install
```

### 2. Obtener credenciales de Spotify

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crea una nueva aplicación
3. Copia el **Client ID** y **Client Secret**
4. En "Edit Settings", agrega como Redirect URI:
   ```
   http://127.0.0.1:8000/callback
   ```

## Instalación

<details>
<summary><strong>Kiro</strong></summary>

### Opción 1: Importar Power (recomendado)

1. Abre Kiro
2. Ve al panel de **Powers**
3. Clic en **"Import Local Power"**
4. Selecciona la carpeta `power/` de este proyecto

### Opción 2: Configuración manual

Edita `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "spotify": {
      "command": "npx",
      "args": ["tsx", "RUTA/AL/PROYECTO/src/index.ts"],
      "env": {
        "SPOTIFY_CLIENT_ID": "tu_client_id",
        "SPOTIFY_CLIENT_SECRET": "tu_client_secret",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:8000/callback"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>VS Code</strong></summary>

Edita tu archivo `mcp.json`:

```json
{
  "mcpServers": {
    "spotify": {
      "command": "npx",
      "args": ["tsx", "RUTA/AL/PROYECTO/src/index.ts"],
      "env": {
        "SPOTIFY_CLIENT_ID": "tu_client_id",
        "SPOTIFY_CLIENT_SECRET": "tu_client_secret",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:8000/callback"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

1. Abre Settings (`Ctrl+Shift+J` o `Cmd+Shift+J`)
2. Ve a la sección **MCP**
3. Agrega el servidor:

```json
{
  "mcpServers": {
    "spotify": {
      "command": "npx",
      "args": ["tsx", "RUTA/AL/PROYECTO/src/index.ts"],
      "env": {
        "SPOTIFY_CLIENT_ID": "tu_client_id",
        "SPOTIFY_CLIENT_SECRET": "tu_client_secret",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:8000/callback"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

Edita el archivo de configuración:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "spotify": {
      "command": "npx",
      "args": ["tsx", "RUTA/AL/PROYECTO/src/index.ts"],
      "env": {
        "SPOTIFY_CLIENT_ID": "tu_client_id",
        "SPOTIFY_CLIENT_SECRET": "tu_client_secret",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:8000/callback"
      }
    }
  }
}
```

Reinicia Claude Desktop después de guardar.

</details>

<details>
<summary><strong>Windsurf</strong></summary>

Agrega a tu configuración MCP:

```json
{
  "mcpServers": {
    "spotify": {
      "command": "npx",
      "args": ["tsx", "RUTA/AL/PROYECTO/src/index.ts"],
      "env": {
        "SPOTIFY_CLIENT_ID": "tu_client_id",
        "SPOTIFY_CLIENT_SECRET": "tu_client_secret",
        "SPOTIFY_REDIRECT_URI": "http://127.0.0.1:8000/callback"
      }
    }
  }
}
```

</details>

## Autenticación

Una vez configurado, usa `spotifyAuth` con `accion: "ejecutar"` desde tu asistente. Se abrirá el navegador para iniciar sesión en Spotify.



## Herramientas

### spotifyAuth

Gestión de autenticación.

| Acción | Descripción |
|--------|-------------|
| `configurar` | Guarda credenciales |
| `verificar` | Verifica estado de autenticación |
| `ejecutar` | Inicia flujo OAuth completo |
| `iniciar` | Abre navegador para auth manual |
| `urlAuth` | Obtiene URL de autorización |
| `cerrar` | Cierra sesión |

### spotifyPlayer

Control de reproducción.

| Acción | Descripción |
|--------|-------------|
| `play` | Reproduce contenido |
| `pause` | Pausa |
| `resume` | Reanuda |
| `next` | Siguiente canción |
| `prev` | Canción anterior |
| `volume` | Ajusta volumen (0-100) |
| `shuffle` | Activa/desactiva aleatorio |
| `repeat` | Modo repetición (track/context/off) |
| `seek` | Salta a posición en ms |
| `queue` | Agrega a la cola |
| `transfer` | Cambia dispositivo |
| `playLiked` | Reproduce canciones guardadas |
| `openApp` | Abre app de Spotify |

### spotifyInfo

Consultas y búsquedas.

| Acción | Descripción |
|--------|-------------|
| `search` | Busca canciones, álbumes, artistas, playlists |
| `nowPlaying` | Canción actual |
| `devices` | Dispositivos disponibles |
| `profile` | Perfil del usuario |
| `queue` | Cola de reproducción |
| `history` | Canciones recientes |
| `saved` | Canciones guardadas |
| `playlists` | Playlists del usuario |
| `playlistTracks` | Canciones de una playlist |
| `albumTracks` | Canciones de un álbum |
| `artistTop` | Top tracks de un artista |
| `topTracks` | Canciones más escuchadas |
| `topArtists` | Artistas más escuchados |
| `state` | Estado de reproducción |

### spotifyLibrary

Gestión de biblioteca.

| Acción | Descripción |
|--------|-------------|
| `save` | Guarda canciones |
| `remove` | Elimina canciones guardadas |
| `check` | Verifica si están guardadas |
| `createPlaylist` | Crea playlist |
| `addToPlaylist` | Agrega canciones a playlist |
| `removeFromPlaylist` | Elimina canciones de playlist |

## Notas

- Los tokens se guardan en `~/.spotify-mcp-tokens.json`
- Spotify Premium es necesario para controlar la reproducción
- El Redirect URI debe coincidir exactamente en el Dashboard y la configuración

## Solución de Problemas

<details>
<summary><strong>Error INVALID_CLIENT</strong></summary>

- Verifica que Client ID y Client Secret sean correctos
- Confirma que el Redirect URI en el Dashboard sea exactamente `http://127.0.0.1:8000/callback`

</details>

<details>
<summary><strong>Error EADDRINUSE (puerto ocupado)</strong></summary>

El puerto 8000 está en uso.

Windows:
```cmd
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

Linux/macOS:
```bash
lsof -i :8000
kill -9 <PID>
```

</details>

<details>
<summary><strong>No se reproduce música</strong></summary>

- Verifica que Spotify esté abierto en algún dispositivo
- Confirma que tienes Spotify Premium
- Usa `spotifyInfo` con `accion: "devices"` para ver dispositivos

</details>
