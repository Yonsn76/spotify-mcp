---
name: "spotify"
displayName: "Spotify Controller"
description: "Control Spotify from your IDE - play music, manage playlists, search tracks, and control playback without leaving your code"
keywords: ["spotify", "music", "player", "streaming", "playlist", "songs", "tracks", "albums", "artists", "audio"]
author: "Yonsn76"
---

# Spotify MCP Power

Control Spotify directly from your IDE using natural language commands.

## Initial Setup

### Step 1: Get Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Copy the Client ID and Client Secret
4. Add `http://127.0.0.1:8000/callback` as Redirect URI in app settings

### Step 2: Configure Credentials

Option A: Add to mcp.json env variables (recommended for initial setup)

Option B: Ask the assistant to configure:
```
Configure Spotify with clientId="your_id" and clientSecret="your_secret"
```

### Step 3: Authenticate

Ask the assistant to run authentication:
```
Authenticate with Spotify
```

## Important Notes

### Active Playback Session Required

Spotify requires an active playback session for player controls to work. If you just opened Spotify without playing anything:

1. The tools may not respond correctly
2. Solution: Manually play any song in Spotify first
3. Once music is playing (even if paused), all tools will work

### Recommended Flow for Playing Music

1. Check devices: `spotifyInfo(accion="devices")`
2. If no devices: `spotifyPlayer(accion="openApp")`
3. Wait for Spotify to load and manually play something
4. Search content: `spotifyInfo(accion="search", consulta="...", tipo="track")`
5. Play: `spotifyPlayer(accion="play", tipo="track", id="ID_FROM_SEARCH")`

## Available Tools

### spotifyAuth - Authentication Management

| Action | Description |
|--------|-------------|
| `verificar` | Check authentication status (use first) |
| `configurar` | Save clientId and clientSecret |
| `ejecutar` | Complete OAuth flow automatically |
| `urlAuth` | Get authorization URL |
| `cerrar` | Logout |

### spotifyPlayer - Playback Control

| Action | Parameters | Description |
|--------|------------|-------------|
| `play` | tipo, id or uri | Play content |
| `pause` | - | Pause playback |
| `resume` | - | Resume playback |
| `next` | - | Next track |
| `prev` | - | Previous track |
| `volume` | valor (0-100) | Set volume |
| `shuffle` | valor (bool) | Toggle shuffle |
| `repeat` | valor (track/context/off) | Set repeat mode |
| `seek` | valor (ms) | Seek to position |
| `queue` | tipo, id or uri | Add to queue |
| `transfer` | dispositivo | Transfer playback |
| `playLiked` | valor (bool=shuffle) | Play liked songs |
| `openApp` | valor (bool=web) | Open Spotify app |

### spotifyInfo - Search and Information

| Action | Parameters | Description |
|--------|------------|-------------|
| `search` | consulta, tipo | Search content |
| `nowPlaying` | - | Current track |
| `devices` | - | List devices |
| `profile` | - | User profile |
| `queue` | - | Playback queue |
| `history` | limite | Recent tracks |
| `saved` | limite, offset | Saved tracks |
| `playlists` | limite | User playlists |
| `playlistTracks` | id, limite | Playlist tracks |
| `albumTracks` | id, limite | Album tracks |
| `artistTop` | id, mercado | Artist top tracks |
| `topTracks` | periodo, limite | Your top tracks |
| `topArtists` | periodo, limite | Your top artists |
| `state` | - | Playback state |

### spotifyLibrary - Library Management

| Action | Parameters | Description |
|--------|------------|-------------|
| `save` | ids | Save tracks to library |
| `remove` | ids | Remove from library |
| `check` | ids | Check if saved |
| `createPlaylist` | nombre, descripcion | Create playlist |
| `addToPlaylist` | playlistId, ids | Add to playlist |
| `removeFromPlaylist` | playlistId, ids | Remove from playlist |

## Troubleshooting

### Tools not responding

If no player tools work:
1. Open Spotify manually
2. Play any song
3. Tools should now work

### No active device

1. Check devices with `spotifyInfo(accion="devices")`
2. If none, open Spotify with `spotifyPlayer(accion="openApp")`
3. Manually play something to activate the session

### Premium required

Playback control requires Spotify Premium. Search and info functions work with free accounts.

## Storage

- Credentials and tokens are stored in `~/.spotify-mcp-tokens.json`
- Tokens refresh automatically
- Redirect URI must match exactly in Dashboard and config
