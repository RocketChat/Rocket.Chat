import { Agent } from 'node:http';

import request from 'supertest';

import { Router } from './Router';
import { nodeHandler } from './middlewares/nodeHandler';
import { RESPONSE_ALREADY_SENT, createMiddlewareSlot, createNodeServer, createRootApp, mountRouter } from './server';
import type { HttpBindings } from './server';

describe('createRootApp', () => {
	it('serves a route added after it has answered a request', async () => {
		const app = createRootApp();
		app.get('/early', (c) => c.text('early'));
		const server = createNodeServer(app).listen(0);

		try {
			expect((await request(server).get('/early')).text).toBe('early');

			app.get('/late', (c) => c.text('late'));

			const response = await request(server).get('/late');

			expect(response.status).toBe(200);
			expect(response.text).toBe('late');
		} finally {
			server.close();
		}
	});

	it('lets a fallback answer on the node response', async () => {
		const app = createRootApp();
		app.notFound((c) => {
			c.env.outgoing.writeHead(418, { 'content-type': 'text/plain' });
			c.env.outgoing.end('from node');
			return RESPONSE_ALREADY_SENT;
		});

		const response = await request(createNodeServer(app)).get('/anything');

		expect(response.status).toBe(418);
		expect(response.text).toBe('from node');
	});
});

describe('nodeHandler', () => {
	const createServer = (handler: Parameters<typeof nodeHandler>[0]) => {
		const app = createRootApp();
		app.use(nodeHandler(handler));
		app.get('/after', (c) => c.text('after'));
		return createNodeServer(app);
	};

	it('returns the response the handler sends', async () => {
		const response = await request(
			createServer((_req, res) => {
				res.writeHead(201).end('from node');
			}),
		).get('/node');

		expect(response.status).toBe(201);
		expect(response.text).toBe('from node');
	});

	it('continues to the next routes when the handler passes the request on', async () => {
		const response = await request(createServer((_req, _res, next) => next())).get('/after');

		expect(response.status).toBe(200);
		expect(response.text).toBe('after');
	});

	it('leaves the request body for the handler to read', async () => {
		const response = await request(
			createServer(async (req, res) => {
				let body = '';
				for await (const chunk of req) {
					body += chunk;
				}
				res.writeHead(200, { 'content-type': 'application/json' }).end(body);
			}),
		)
			.post('/echo')
			.send({ a: 1 });

		expect(response.body).toEqual({ a: 1 });
	});

	it('answers 500 when the handler passes an error on', async () => {
		const response = await request(createServer((_req, _res, next) => next(new Error('broken')))).get('/broken');

		expect(response.status).toBe(500);
	});
});

describe('mountRouter', () => {
	const createServer = () => {
		const app = createRootApp();
		const router = new Router('/api');
		router.get('echo', {}, async (c) => ({ statusCode: 200, body: { path: new URL(c.req.url).pathname } }));
		router.post('echo', {}, async (c) => ({ statusCode: 200, body: await c.req.json() }));
		mountRouter(app, router);
		app.notFound((c) => c.text('fallback', 404));
		return createNodeServer(app);
	};

	it('answers routes under the base with the full request path', async () => {
		const response = await request(createServer()).get('/api/echo');

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ path: '/api/echo' });
	});

	it('hands the request body to the route', async () => {
		const response = await request(createServer()).post('/api/echo').send({ a: 1 });

		expect(response.body).toEqual({ a: 1 });
	});

	it('leaves the body on the incoming message for a route that clones the request', async () => {
		const app = createRootApp();
		const router = new Router('/api');
		router.post('stream', {}, async (c) => {
			c.req.raw.clone();
			await new Promise((resolve) => setTimeout(resolve, 50));
			let length = 0;
			for await (const chunk of (c.env as HttpBindings).incoming) {
				length += chunk.length;
			}
			return { statusCode: 200, body: { length } };
		});
		mountRouter(app, router);

		const response = await request(createNodeServer(app))
			.post('/api/stream')
			.set('content-type', 'application/octet-stream')
			.send(Buffer.alloc(1024 * 1024));

		expect(response.body).toEqual({ length: 1024 * 1024 });
	});

	it('keeps the connection usable after a route answers without reading the body', async () => {
		const app = createRootApp();
		const router = new Router('/api');
		router.post('ignore', {}, async (c) => {
			c.req.raw.clone();
			return { statusCode: 403, body: {} };
		});
		router.get('echo', {}, async () => ({ statusCode: 200, body: {} }));
		mountRouter(app, router);
		const server = createNodeServer(app).listen(0);
		const agent = new Agent({ keepAlive: true, maxSockets: 1 });

		try {
			await request(server)
				.post('/api/ignore')
				.agent(agent)
				.set('content-type', 'application/octet-stream')
				.send(Buffer.alloc(1024 * 1024));

			const response = await request(server).get('/api/echo').agent(agent).timeout(400);

			expect(response.status).toBe(200);
		} finally {
			agent.destroy();
			server.close();
		}
	});

	it('answers unknown paths under the base itself', async () => {
		const response = await request(createServer()).get('/api/unknown');

		expect(response.status).toBe(404);
		expect(response.text).not.toBe('fallback');
	});

	it('leaves paths outside the base to the app', async () => {
		const response = await request(createServer()).get('/apix');

		expect(response.text).toBe('fallback');
	});
});

describe('createMiddlewareSlot', () => {
	it('runs middlewares added after a route ahead of that route', async () => {
		const app = createRootApp();
		const slot = createMiddlewareSlot();
		app.use(slot.middleware);
		app.get('/route', (c) => c.text('route'));

		slot.add(async (c, next) => {
			await next();
			c.res.headers.set('x-first', '1');
		});
		slot.add(async (c, next) => {
			await next();
			c.res.headers.set('x-second', c.res.headers.get('x-first') ?? 'not yet');
		});

		const response = await request(createNodeServer(app)).get('/route');

		expect(response.text).toBe('route');
		expect(response.headers['x-first']).toBe('1');
		expect(response.headers['x-second']).toBe('not yet');
	});

	it('lets a middleware answer instead of the route', async () => {
		const app = createRootApp();
		const slot = createMiddlewareSlot();
		app.use(slot.middleware);
		app.get('/route', (c) => c.text('route'));
		slot.add((c) => Promise.resolve(c.text('redirected', 302)));

		const response = await request(createNodeServer(app)).get('/route');

		expect(response.status).toBe(302);
		expect(response.text).toBe('redirected');
	});
});
