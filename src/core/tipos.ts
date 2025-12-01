import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

export type ContextoExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

export type Herramienta<Args extends z.ZodRawShape> = {
  nombre: string;
  descripcion: string;
  esquema: Args;
  ejecutar: (
    args: z.infer<z.ZodObject<Args>>,
    extra: ContextoExtra,
  ) =>
    | Promise<{ content: Array<{ type: 'text'; text: string }> }>
    | { content: Array<{ type: 'text'; text: string }> };
};

export interface ArtistaSpotify {
  id: string;
  name: string;
}

export interface AlbumSpotify {
  id: string;
  name: string;
  artists: ArtistaSpotify[];
}

export interface CancionSpotify {
  id: string;
  name: string;
  type: string;
  duration_ms: number;
  artists: ArtistaSpotify[];
  album: AlbumSpotify;
}
