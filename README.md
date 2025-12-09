# Spotify MCP Server

<p align="center">
  <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2023/05/Spotify_Primary_Logo_RGB_Green.png" width="200" alt="Spotify Logo">
</p>

Servidor MCP (Model Context Protocol) para controlar Spotify desde asistentes de IA como Claude, Cursor, Kiro, VS Code, Windsurf, etc.

## Requisitos

- Node.js 18+
- Cuenta de Spotify Premium (requerido para control de reproduccion)
- Credenciales de la API de Spotify

## Configuracion Inicial

### 1. Clonar el proyecto

```bash
git clone https://github.com/Yonsn76/spotify-mcp.git
cd spotify-mcp
npm install
npm run build
```

### 2. Obtener credenciales de Spotify

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crea una nueva aplicacion
3. Copia el **Client ID** y **Client Secret**
4. En "Edit Settings", agrega como Redirect URI: `http://127.0.0.1:8000/callback`

### 3. Configurar credenciales

Hay dos formas de configurar las credenciales:

**Opcion A: Variables de entorno en mcp.json (recomendado para configuracion inicial)**

Agrega las credenciales en el archivo de configuracion MCP de tu IDE.

**Opcion B: Configuracion por el LLM**

Puedes pedirle al asistente que configure las credenciales usando:
```
spotifyAuth(accion="configurar", clientId="tu_client_id", clientSecret="tu_client_secret")
```
Las credenciales se guardan en `~/.spotify-mcp-tokens.json` junto con los tokens de sesion.

## Instalacion por IDE

<details>
<summary><strong>Kiro</strong></summary>

**Opcion 1: Importar Power (recomendado)**

1. Abre Kiro
2. Ve al panel de Powers
3. Clic en "Import Local Power"
4. Selecciona la carpeta `power-kiro/` de este proyecto

**Opcion 2: Configuracion manual**

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

Edita tu archivo de configuracion MCP:

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

1. Abre Settings (Ctrl+Shift+J o Cmd+Shift+J)
2. Ve a la seccion MCP
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

Edita el archivo de configuracion:
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

Reinicia Claude Desktop despues de guardar.

</details>

<details>
<summary><strong>Windsurf</strong></summary>

Agrega a tu configuracion MCP:

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

## Autenticacion

Una vez configurado el servidor MCP:

1. Usa `spotifyAuth(accion="verificar")` para ver el estado actual
2. Si no hay credenciales, configuralas con `spotifyAuth(accion="configurar", clientId="...", clientSecret="...")`
3. Usa `spotifyAuth(accion="ejecutar")` para completar el flujo OAuth (abre navegador automaticamente)

## Herramientas Disponibles

El servidor expone 4 herramientas consolidadas:

### spotifyAuth - Autenticacion

| Accion | Descripcion |
|--------|-------------|
| `verificar` | Comprueba estado de autenticacion (usar primero) |
| `configurar` | Guarda clientId y clientSecret |
| `ejecutar` | Completa flujo OAuth automatico |
| `iniciar` | Abre navegador para auth manual |
| `urlAuth` | Obtiene URL de autorizacion |
| `cerrar` | Cierra sesion |

### spotifyPlayer - Control de Reproduccion

| Accion | Parametros | Descripcion |
|--------|------------|-------------|
| `play` | tipo, id o uri | Reproduce contenido |
| `pause` | - | Pausa reproduccion |
| `resume` | - | Reanuda reproduccion |
| `next` | - | Siguiente cancion |
| `prev` | - | Cancion anterior |
| `volume` | valor (0-100) | Ajusta volumen |
| `shuffle` | valor (bool) | Activa/desactiva aleatorio |
| `repeat` | valor (track/context/off) | Modo repeticion |
| `seek` | valor (ms) | Salta a posicion |
| `queue` | tipo, id o uri | Agrega a la cola |
| `transfer` | dispositivo | Cambia dispositivo |
| `playLiked` | valor (bool=shuffle) | Reproduce Me gusta |
| `openApp` | valor (bool=web) | Abre Spotify |

### spotifyInfo - Busqueda e Informacion

| Accion | Parametros | Descripcion |
|--------|------------|-------------|
| `search` | consulta, tipo | Busca contenido |
| `nowPlaying` | - | Cancion actual |
| `devices` | - | Lista dispositivos |
| `profile` | - | Perfil del usuario |
| `queue` | - | Cola de reproduccion |
| `history` | limite | Canciones recientes |
| `saved` | limite, offset | Canciones guardadas |
| `playlists` | limite | Playlists del usuario |
| `playlistTracks` | id, limite | Canciones de playlist |
| `albumTracks` | id, limite | Canciones de album |
| `artistTop` | id, mercado | Top de artista |
| `topTracks` | periodo, limite | Tus canciones top |
| `topArtists` | periodo, limite | Tus artistas top |
| `state` | - | Estado de reproduccion |

### spotifyLibrary - Gestion de Biblioteca

| Accion | Parametros | Descripcion |
|--------|------------|-------------|
| `save` | ids | Guarda canciones en Me gusta |
| `remove` | ids | Quita de Me gusta |
| `check` | ids | Verifica si estan guardadas |
| `createPlaylist` | nombre, descripcion, publica | Crea playlist |
| `addToPlaylist` | playlistId, ids, posicion | Agrega a playlist |
| `removeFromPlaylist` | playlistId, ids | Quita de playlist |
| `deletePlaylist` | playlistId | Elimina playlist |
| `renamePlaylist` | playlistId, nombre | Renombra playlist |

## Notas Importantes

### Sesion de Reproduccion Activa

Spotify requiere que haya una sesion de reproduccion activa para que las herramientas de control funcionen. Si acabas de abrir Spotify sin reproducir nada:

1. El servidor MCP puede no responder correctamente
2. Solucion: Reproduce cualquier cancion manualmente en Spotify
3. Una vez que haya musica sonando (aunque este pausada), las herramientas funcionaran

### Flujo Recomendado para Reproducir

1. Verificar dispositivos: `spotifyInfo(accion="devices")`
2. Si no hay dispositivos: `spotifyPlayer(accion="openApp")`
3. Esperar a que Spotify cargue y reproducir algo manualmente
4. Buscar contenido: `spotifyInfo(accion="search", consulta="...", tipo="track")`
5. Reproducir: `spotifyPlayer(accion="play", tipo="track", id="ID_OBTENIDO")`

### Almacenamiento

- Credenciales y tokens se guardan en `~/.spotify-mcp-tokens.json`
- Los tokens se refrescan automaticamente
- El Redirect URI debe coincidir exactamente en el Dashboard y la configuracion

## Solucion de Problemas

<details>
<summary><strong>Error: Credenciales no configuradas</strong></summary>

Usa `spotifyAuth(accion="configurar", clientId="...", clientSecret="...")` o agrega las variables de entorno en el mcp.json.

</details>

<details>
<summary><strong>Error: No hay dispositivo activo</strong></summary>

1. Verifica dispositivos con `spotifyInfo(accion="devices")`
2. Si no hay ninguno, abre Spotify con `spotifyPlayer(accion="openApp")`
3. Reproduce algo manualmente para activar la sesion

</details>

<details>
<summary><strong>Error: Premium requerido</strong></summary>

El control de reproduccion requiere Spotify Premium. Las funciones de busqueda e informacion funcionan con cuentas gratuitas.

</details>

<details>
<summary><strong>Error: INVALID_CLIENT</strong></summary>

- Verifica que Client ID y Client Secret sean correctos
- Confirma que el Redirect URI en el Dashboard sea exactamente `http://127.0.0.1:8000/callback`

</details>

<details>
<summary><strong>Error: EADDRINUSE (puerto ocupado)</strong></summary>

El puerto 8000 esta en uso.

Windows:
```cmd
netstat -ano | findstr :8000
taskkill /PID [PID] /F
```

Linux/macOS:
```bash
lsof -i :8000
kill -9 [PID]
```

</details>

<details>
<summary><strong>Las herramientas no responden</strong></summary>

Si ninguna herramienta del player funciona:
1. Abre Spotify manualmente
2. Reproduce cualquier cancion
3. Ahora las herramientas deberian funcionar

</details>

