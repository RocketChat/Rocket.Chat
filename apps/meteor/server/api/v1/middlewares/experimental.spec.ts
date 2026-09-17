import { Router } from '@rocket.chat/http-router';
import Ajv from 'ajv';
import express from 'express';
import request from 'supertest';

import { cors } from './cors';
import { experimentalWarningMiddleware } from './experimental';
import { CachedSettings } from '../../../settings/CachedSettings';

const WARNING_HEADER = '299 - "experimental: endpoint is unstable and may change without notice"';

const buildApp = ({ corsEnabled }: { corsEnabled: boolean }) => {
	const ajv = new Ajv();
	const settings = new CachedSettings();
	settings.set({ _id: 'API_Enable_CORS', value: corsEnabled } as any);
	settings.set({ _id: 'API_CORS_Origin', value: 'https://allowed.example' } as any);

	const route = (router: Router<any, any, any>) =>
		router.get('/test', { response: { 200: ajv.compile({ type: 'object' }) } }, async () => ({
			statusCode: 200 as const,
			body: {},
		}));

	const api = new Router('/api')
		.use(experimentalWarningMiddleware({ basePathRegex: new RegExp(/^\/api\/experimental(\/|$)/) }))
		.use(cors(settings))
		.use(route(new Router('/v1')))
		.use(route(new Router('/experimental')));

	const app = express();
	app.use(api.router);
	return app;
};

const preflight = (app: express.Express, path: string, origin: string) =>
	request(app).options(path).set('Origin', origin).set('Access-Control-Request-Method', 'GET');

describe('Experimental middleware', () => {
	it('should stamp the unstable signal headers on experimental responses', async () => {
		const res = await request(buildApp({ corsEnabled: true })).get('/api/experimental/test');

		expect(res.statusCode).toBe(200);
		expect(res.headers['x-experimental']).toBe('true');
		expect(res.headers.warning).toBe(WARNING_HEADER);
	});

	it('should not stamp responses from other versions', async () => {
		const res = await request(buildApp({ corsEnabled: true })).get('/api/v1/test');

		expect(res.statusCode).toBe(200);
		expect(res.headers['x-experimental']).toBeUndefined();
		expect(res.headers.warning).toBeUndefined();
	});

	it('should stamp 404s for unmatched experimental paths', async () => {
		const res = await request(buildApp({ corsEnabled: true })).get('/api/experimental/nope');

		expect(res.statusCode).toBe(404);
		expect(res.headers['x-experimental']).toBe('true');
	});

	// cors answers rejected preflights without calling next(), so these only carry the headers
	// while the middleware stays registered ahead of it
	it('should stamp preflight rejections when CORS is disabled', async () => {
		const res = await preflight(buildApp({ corsEnabled: false }), '/api/experimental/test', 'https://allowed.example');

		expect(res.statusCode).toBe(405);
		expect(res.headers['x-experimental']).toBe('true');
		expect(res.headers.warning).toBe(WARNING_HEADER);
	});

	it('should stamp preflight rejections from disallowed origins', async () => {
		const res = await preflight(buildApp({ corsEnabled: true }), '/api/experimental/test', 'https://evil.example');

		expect(res.statusCode).toBe(403);
		expect(res.headers['x-experimental']).toBe('true');
		expect(res.headers.warning).toBe(WARNING_HEADER);
	});

	it('should not stamp preflight rejections from other versions', async () => {
		const res = await preflight(buildApp({ corsEnabled: true }), '/api/v1/test', 'https://evil.example');

		expect(res.statusCode).toBe(403);
		expect(res.headers['x-experimental']).toBeUndefined();
	});
});
