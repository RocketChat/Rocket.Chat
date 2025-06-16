import 'reflect-metadata';

import { createLogger } from './utils/logger';
import { homeserverModule } from './homeserver.module';
import { registerAllElysiaRoutes } from './controllers';
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { cors as honoCors } from 'hono/cors';
import { serve } from '@hono/node-server';

const logger = createLogger('HomeserverServer');

async function startElysiaServer(port: number): Promise<void> {
	const app = new Elysia()
		.use(swagger())
		.use(cors())
		.onError(({ error, set }) => {
			logger.error('Request error:', error);
			
			if (error instanceof Error) {
				if (error.message.includes('not found')) {
					set.status = 404;
				} else if (error.message.includes('unauthorized')) {
					set.status = 401;
				} else if (error.message.includes('forbidden')) {
					set.status = 403;
				} else {
					set.status = 500;
				}
			}
			
			return {
				errcode: 'M_UNKNOWN',
				error: error instanceof Error ? error.message : 'Internal server error',
			};
		});
	
	registerAllElysiaRoutes(app);
	app.listen(port);
	logger.info(`Homeserver listening on port ${port} (Bun + Elysia)`);
}

async function startHonoServer(port: number): Promise<void> {
	const app = new Hono();
	
	app.use('*', honoCors());
	
	app.onError((err: Error, c: Context) => {
		logger.error('Request error:', err);
		
		let status = 500;
		if (err.message.includes('not found')) {
			status = 404;
		} else if (err.message.includes('unauthorized')) {
			status = 401;
		} else if (err.message.includes('forbidden')) {
			status = 403;
		}
		
		return c.json({
			errcode: 'M_UNKNOWN',
			error: err.message || 'Internal server error',
		}, status);
	});
	
	const routes = await homeserverModule.getRouteHandlers();

	routes.forEach(route => {
		const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';
		const path = route.path.replace(/:([^/]+)/g, ':$1');
		
		app[method](path, async (c: Context) => {
			try {
				const context = {
					params: c.req.param(),
					query: Object.fromEntries(new URL(c.req.url).searchParams),
					body: await c.req.json().catch(() => ({})),
					headers: Object.fromEntries(c.req.raw.headers),
					set: {
						status: (code: number) => c.status(code),
						headers: (headers: Record<string, string>) => {
							Object.entries(headers).forEach(([key, value]) => {
								c.header(key, value);
							});
						}
					}
				};
				
				const result = await route.handler(context);
				return c.json(result);
			} catch (error) {
				logger.error('Route error:', error);
				return c.json({ 
					errcode: 'M_UNKNOWN',
					error: error instanceof Error ? error.message : 'Internal server error' 
				}, 500);
			}
		});
	});
	
	serve({
		fetch: app.fetch,
		port,
	});
	
	logger.info(`Homeserver listening on port ${port} (Node.js + Hono)`);
}

async function startServer(port: number): Promise<void> {
	if (typeof Bun !== 'undefined') {
		logger.info('Detected Bun runtime - using Elysia');
		await startElysiaServer(port);
	} else {
		logger.info('Detected Node.js runtime - using Hono');
		await startHonoServer(port);
	}
}

async function start() {
	try {
		const port = parseInt(process.env.HOMESERVER_PORT || '8448', 10);
		
		await homeserverModule.initialize();
		await startServer(port);
		
		process.on('SIGTERM', async () => {
			logger.info('SIGTERM received, shutting down gracefully...');
			process.exit(0);
		});
		
		process.on('SIGINT', async () => {
			logger.info('SIGINT received, shutting down gracefully...');
			process.exit(0);
		});
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

start();