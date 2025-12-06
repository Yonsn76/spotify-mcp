---
name: "spotify"
displayName: "Spotify Controller"
description: "Control Spotify from your IDE - play music, manage playlists, search tracks, and control playback without leaving your code"
keywords: ["spotify", "music", "player", "streaming", "playlist", "songs", "tracks", "albums", "artists", "audio"]
author: "Yonsn"
---

# Workflow

Execute this file to set up Spotify control in Kiro.

## Step 1: Authentication Setup

First, verify if you're already authenticated with Spotify:

1. Call the `verificarEstado` tool to check authentication status
2. If not authenticated, call `ejecutarAutenticacion` to start the OAuth flow
3. A browser window will open - log in to Spotify and authorize the app

## Step 2: Create a Playback Control Hook

Create a hook for quick music control while coding. Save the hook in `.kiro/hooks/spotify-control.kiro.hook`:

```json
{
  "enabled": true,
  "name": "Spotify Quick Control",
  "description": "Control Spotify playback with voice commands",
  "version": "1",
  "when": {
    "type": "manual"
  },
  "then": {
    "type": "askAgent",
    "prompt": "Ask the user what they want to do with Spotify: play/pause, next/previous track, search for music, or check what's playing. Execute the appropriate Spotify tool based on their response."
  },
  "shortName": "spotify"
}
```

# Spotify MCP Integration Guidelines

- Always check `verificarEstado` before attempting playback operations to ensure authentication is valid
- Use `obtenerDispositivos` to verify an active Spotify device is available before playing music
- When searching, use specific queries - include artist name for better results
- Spotify Premium is required for playback control features
- Tokens are stored in `~/.spotify-mcp-tokens.json` and refresh automatically
- The redirect URI must be exactly `http://127.0.0.1:8000/callback` in both Spotify Dashboard and config

# Available Tools

## Authentication
- `verificarEstado` - Check if authenticated
- `ejecutarAutenticacion` - Start OAuth flow
- `cerrarSesion` - Log out

## Playback Control
- `reproducir` - Play track/album/playlist/artist
- `pausar` / `reanudar` - Pause/resume playback
- `siguiente` / `anterior` - Next/previous track
- `ajustarVolumen` - Set volume (0-100)
- `activarAleatorio` - Toggle shuffle
- `modoRepeticion` - Set repeat mode (track/context/off)

## Search & Discovery
- `buscar` - Search tracks, albums, artists, playlists
- `obtenerReproduccionActual` - Get current track info
- `obtenerTopCanciones` / `obtenerTopArtistas` - Your top items
- `obtenerHistorial` - Recently played

## Library Management
- `guardarCancion` / `eliminarCancion` - Manage liked songs
- `crearPlaylist` - Create new playlist
- `agregarAPlaylist` / `eliminarDePlaylist` - Manage playlist tracks
