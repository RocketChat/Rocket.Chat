import { createServer } from 'node:http';
import type { IncomingMessage, Server } from 'node:http';

import { getRequestListener } from '@hono/node-server';
import type { HttpBindings } from '@hono/node-server';
import { Hono } from 'hono';
import type { MiddlewareHandler } from 'hono';
import { every } from 'hono/combine';
import { TrieRouter } from 'hono/router/trie-router';

import type { Router } from './Router';

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
 * A middleware that runs the middlewares later added to it, in order. Registered on an app, they run ahead of every
 * route registered after it, whenever they are added.
 */
export const createMiddlewareSlot = (): { middleware: RootMiddleware; add: (...middlewares: RootMiddleware[]) => void } => {
	const middlewares: RootMiddleware[] = [];

	return {
		middleware: (c, next) => every(...middlewares)(c, next),
		add: (...added) => {
			middlewares.push(...added);
		},
	};
};

/**
 * A node HTTP server answered by `app`. The global `Request` and `Response` are left alone, since code sharing the
 * process relies on Node's own.
 */
export const createNodeServer = (app: RootApp): Server => createServer(getRequestListener(app.fetch, { overrideGlobalObjects: false }));

/**
 * A request whose body is read from the incoming message only as it is consumed, so cloning it reads nothing and a
 * route may still stream the body from the incoming message itself.
 */
const lazyBodyRequest = (raw: Request, incoming: IncomingMessage): Request =>
	new Request(raw.url, {
		method: raw.method,
		headers: raw.headers,
		signal: raw.signal,
		...(!['GET', 'HEAD'].includes(raw.method) && { body: incoming as unknown as ReadableStream, duplex: 'half' }),
	});

/**
 * Answers every request under the router's base with the routes the router has when it is mounted.
 */
export const mountRouter = (app: RootApp, router: Pick<Router<string>, 'base' | 'toHono'>): void => {
	const routed = router.toHono();
	app.all(`${router.base}/*`, (c) => routed.fetch(lazyBodyRequest(c.req.raw, c.env.incoming), c.env));
};
