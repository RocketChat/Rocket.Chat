import { createServer } from 'node:http';
import type { Server } from 'node:http';

import { getRequestListener } from '@hono/node-server';
import type { HttpBindings } from '@hono/node-server';
import { Hono } from 'hono';
import type { MiddlewareHandler } from 'hono';
import { TrieRouter } from 'hono/router/trie-router';

export type { HttpBindings } from '@hono/node-server';
export { RESPONSE_ALREADY_SENT } from '@hono/node-server/utils/response';

export type RootApp = Hono<{ Bindings: HttpBindings }>;

export type RootMiddleware = MiddlewareHandler<{ Bindings: HttpBindings }>;

/**
 * An app that can still take routes after it has answered requests, for routes mounted only once a license or setting
 * allows them.
 */
export const createRootApp = (): RootApp => new Hono<{ Bindings: HttpBindings }>({ router: new TrieRouter() });

/**
 * A node HTTP server answered by `app`. The global `Request` and `Response` are left alone, since code sharing the
 * process relies on Node's own.
 */
export const createNodeServer = (app: RootApp): Server => createServer(getRequestListener(app.fetch, { overrideGlobalObjects: false }));
