<p align="center">
  <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" alt="Spotify Logo" width="200"/>
</p>

<h1 align="center">Spotify MCP</h1>

Servidor MCP (Model Context Protocol) para controlar Spotify desde asistentes de IA como Claude, Kiro u otros clientes compatibles.

## Que es MCP?

MCP (Model Context Protocol) es un protocolo abierto que permite a los modelos de IA conectarse con servicios externos. Este servidor expone herramientas para controlar Spotify directamente desde tu asistente de IA.

## Requisitos

- Node.js 18+
- Cuenta de Spotify (Premium recomendado para control de reproduccion)
- Credenciales de la API de Spotify

## Instalacion

1. Clona el repositorio:
```bash
git clone https://github.com/Yonsn76/spotify-mcp.git
cd spotify-mcp
```

2. Instala las dependencias:
```bash
npm install
```

3. Compila el proyecto:
```bash
npm run build
```

## Configuracion de Spotify

### 1. Crear una aplicacion en Spotify

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Inicia sesion con tu cuenta de Spotify
3. Crea una nueva aplicacion
4. En la configuracion de la app, agrega esta URI de redireccion:
   ```
   http://127.0.0.1:8000/callback
   ```
5. Copia el **Client ID** y **Client Secret**

### 2. Configurar credenciales

Copia el archivo de ejemplo y edita con tus credenciales:

```bash
copy sp-credentials.example.json sp-credentials.json
```

Edita `sp-credentials.json`:
```json
{
  "clientId": "TU_CLIENT_ID",
  "clientSecret": "TU_CLIENT_SECRET",
  "redirectUri": "http://127.0.0.1:8000/callback"
}
```

### 3. Autenticarse con Spotify

```bash
npm run auth
```

Se abrira el navegador para autorizar la aplicacion. Una vez autorizado, los tokens se guardaran automaticamente.

## Configuracion del cliente MCP

### Claude Desktop

Agrega esto a tu archivo de configuracion de Claude (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "spotify": {
      "command": "node",
      "args": ["C:/ruta/a/spotify-mcp-server/build/index.js"]
    }
  }
}
```

### Kiro

Agrega esto a `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "spotify": {
      "command": "node",
      "args": ["C:/ruta/a/spotify-mcp-server/build/index.js"]
    }
  }
}
```

## Herramientas disponibles

### Autenticacion

| Herramienta | Descripcion |
|-------------|-------------|
| `configurarCredenciales` | Configura Client ID y Secret de Spotify |
| `verificarEstado` | Verifica si estas autenticado |
| `iniciarAutenticacion` | Inicia el flujo OAuth |
| `obtenerUrlAuth` | Obtiene la URL de autorizacion |
| `cerrarSesion` | Cierra la sesion actual |

### Reproduccion

| Herramienta | Descripcion |
|-------------|-------------|
| `reproducir` | Reproduce una cancion, album, artista o playlist |
| `pausar` | Pausa la reproduccion |
| `reanudar` | Reanuda la reproduccion |
| `siguiente` | Salta a la siguiente cancion |
| `anterior` | Vuelve a la cancion anterior |
| `ajustarVolumen` | Ajusta el volumen (0-100) |
| `activarAleatorio` | Activa/desactiva modo aleatorio |
| `modoRepeticion` | Configura repeticion (track/context/off) |
| `cambiarDispositivo` | Transfiere reproduccion a otro dispositivo |
| `saltarAPosicion` | Salta a una posicion especifica |
| `agregarACola` | Agrega contenido a la cola |

### Consultas

| Herramienta | Descripcion |
|-------------|-------------|
| `buscar` | Busca canciones, albums, artistas o playlists |
| `obtenerReproduccionActual` | Muestra que se esta reproduciendo |
| `obtenerMisPlaylists` | Lista tus playlists |
| `obtenerCancionesPlaylist` | Muestra canciones de una playlist |
| `obtenerHistorial` | Muestra canciones reproducidas recientemente |
| `obtenerCancionesGuardadas` | Lista tus canciones guardadas |
| `obtenerDispositivos` | Lista dispositivos disponibles |
| `obtenerPerfil` | Muestra tu perfil de Spotify |
| `obtenerTopCanciones` | Tus canciones mas escuchadas |
| `obtenerTopArtistas` | Tus artistas mas escuchados |
| `obtenerCancionesAlbum` | Canciones de un album |
| `obtenerTopCancionesArtista` | Top canciones de un artista |
| `obtenerEstadoReproduccion` | Estado actual (volumen, aleatorio, etc) |
| `obtenerCola` | Muestra la cola de reproduccion |

### Biblioteca

| Herramienta | Descripcion |
|-------------|-------------|
| `guardarCancion` | Guarda canciones en tu biblioteca |
| `eliminarCancion` | Elimina canciones de tu biblioteca |
| `verificarGuardadas` | Verifica si canciones estan guardadas |
| `crearPlaylist` | Crea una nueva playlist |
| `agregarAPlaylist` | Agrega canciones a una playlist |
| `eliminarDePlaylist` | Elimina canciones de una playlist |

## Ejemplos de uso

Una vez configurado, puedes pedirle a tu asistente de IA cosas como:

- "Reproduce musica de Bad Bunny"
- "Que cancion esta sonando?"
- "Sube el volumen a 80"
- "Muestra mis playlists"
- "Crea una playlist llamada Favoritos 2024"
- "Agrega esta cancion a mi playlist"
- "Cuales son mis artistas mas escuchados?"

## Estructura del proyecto

```
spotify-mcp/
├── src/
│   ├── index.ts              # Punto de entrada del servidor
│   ├── auth.ts               # Script de autenticacion OAuth
│   ├── core/                 # Modulos centrales
│   │   ├── tipos.ts          # Tipos e interfaces
│   │   ├── configuracion.ts  # Manejo de configuracion
│   │   └── spotify.ts        # Cliente API de Spotify
│   └── tools/                # Herramientas MCP
│       ├── autenticacion.ts  # Herramientas de auth
│       ├── biblioteca.ts     # Herramientas de biblioteca
│       ├── consultas.ts      # Herramientas de consulta
│       └── reproduccion.ts   # Herramientas de reproduccion
├── sp-credentials.json       # Tu configuracion (ignorado en git)
├── sp-credentials.example.json
├── package.json
└── tsconfig.json
```

## Solucion de problemas

### "No hay dispositivos disponibles"
Asegurate de tener Spotify abierto en algun dispositivo (telefono, computadora, etc).

### "Token expirado"
Ejecuta `npm run auth` nuevamente para obtener un nuevo token.

### "Credenciales no configuradas"
Verifica que `sp-credentials.json` existe y tiene los datos correctos.


