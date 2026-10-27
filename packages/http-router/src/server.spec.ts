import express from 'express';
import request from 'supertest';

import { nodeHandler } from './middlewares/nodeHandler';
import { RESPONSE_ALREADY_SENT, createNodeServer, createRootApp } from './server';

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
	const createServer = (expressApp: express.Express) => {
		const app = createRootApp();
		app.use(nodeHandler(expressApp));
		app.get('/after', (c) => c.text('after'));
		return createNodeServer(app);
	};

	it('returns the response the express app sends', async () => {
		const expressApp = express().get('/express', (_req, res) => {
			res.status(201).send('from express');
		});

		const response = await request(createServer(expressApp)).get('/express');

		expect(response.status).toBe(201);
		expect(response.text).toBe('from express');
	});

	it('continues to the next routes when the express app passes the request on', async () => {
		const expressApp = express().get('/express', (_req, res) => {
			res.send('from express');
		});

		const response = await request(createServer(expressApp)).get('/after');

		expect(response.status).toBe(200);
		expect(response.text).toBe('after');
	});

	it('leaves the request body for the express app to read', async () => {
		const expressApp = express().post('/echo', express.json(), (req, res) => {
			res.json(req.body);
		});

		const response = await request(createServer(expressApp)).post('/echo').send({ a: 1 });

		expect(response.body).toEqual({ a: 1 });
	});

	it('answers 500 when the express app passes an error on', async () => {
		const expressApp = express().get('/broken', (_req, _res, next) => {
			next(new Error('broken'));
		});

		const response = await request(createServer(expressApp)).get('/broken');

		expect(response.status).toBe(500);
	});
});
