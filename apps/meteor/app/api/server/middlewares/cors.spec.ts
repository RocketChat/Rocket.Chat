import Ajv from 'ajv';
import express from 'express';
import request from 'supertest';

import { cors } from './cors';
import { CachedSettings } from '../../../settings/server/CachedSettings';
import { Router } from '../router';

describe('Cors middleware', () => {
	it('should not enforce CORS headers for GET', async () => {
		const ajv = new Ajv();
		const app = express();
		const api = new Router('/api');
		const settings = new CachedSettings();

		settings.set({
			_id: 'API_Enable_CORS',
			value: true,
		} as any);
		settings.set({
			_id: 'API_CORS_Origin',
			value: '*',
		} as any);

		api.use(cors(settings)).get(
			'/test',
			{
				response: {
					200: ajv.compile({
						type: 'object',
						properties: {
							message: { type: 'string' },
						},
					}),
				},
			},
			async () => {
				return {
					statusCode: 200,
					body: {
						message: 'CORS test successful',
					},
				};
			},
		);

		app.use(api.router);

		const response = await request(app).get('/api/test').set('origin', 'http://localhost');

		expect(response.statusCode).toBe(200);
		expect(response.body).toHaveProperty('message', 'CORS test successful');
		expect(response.headers).not.toHaveProperty('access-control-allow-origin', '*');
		expect(response.headers).toHaveProperty('access-control-allow-methods', 'GET, POST, PUT, DELETE, HEAD, PATCH');
		expect(response.headers).toHaveProperty(
			'access-control-allow-headers',
			'Origin, X-Requested-With, Content-Type, Accept, X-User-Id, X-Auth-Token, x-visitor-token, Authorization',
		);
	});

	it('should not return CORS headers for GET if CORS disabled', async () => {
		const ajv = new Ajv();
		const app = express();
		const api = new Router('/api');
		const settings = new CachedSettings();

		settings.set({
			_id: 'API_Enable_CORS',
			value: false,
		} as any);

		api.use(cors(settings)).get(
			'/test',
			{
				response: {
					200: ajv.compile({
						type: 'object',
						properties: {
							message: { type: 'string' },
						},
					}),
				},
			},
			async () => {
				return {
					statusCode: 200,
					body: {
						message: 'CORS test successful',
					},
				};
			},
		);

		app.use(api.router);

		const response = await request(app).get('/api/test').set('origin', 'http://localhost');

		expect(response.statusCode).toBe(200);
		expect(response.body).toHaveProperty('message', 'CORS test successful');
		expect(response.headers).not.toHaveProperty('access-control-allow-origin');
		expect(response.headers).not.toHaveProperty('access-control-allow-methods');
		expect(response.headers).not.toHaveProperty('access-control-allow-headers');
	});

	it('should handle CORS if enabled to *', async () => {
		const ajv = new Ajv();
		const app = express();
		const api = new Router('/api');
		const settings = new CachedSettings();

		settings.set({
			_id: 'API_Enable_CORS',
			value: true,
		} as any);
		settings.set({
			_id: 'API_CORS_Origin',
			value: '*',
		} as any);

		api.use(cors(settings)).get(
			'/test',
			{
				response: {
					200: ajv.compile({
						type: 'object',
						properties: {
							message: { type: 'string' },
						},
					}),
				},
			},
			async () => {
				return {
					statusCode: 200,
					body: {
						message: 'CORS test successful',
					},
				};
			},
		);

		app.use(api.router);

		const response = await request(app).options('/api/test').set('origin', 'http://localhost');

		expect(response.statusCode).toBe(200);
		expect(response.body).not.toHaveProperty('message', 'CORS test successful');
		expect(response.headers).toHaveProperty('access-control-allow-origin', '*');
		expect(response.headers).toHaveProperty('access-control-allow-methods', 'GET, POST, PUT, DELETE, HEAD, PATCH');
		expect(response.headers).toHaveProperty(
			'access-control-allow-headers',
			'Origin, X-Requested-With, Content-Type, Accept, X-User-Id, X-Auth-Token, x-visitor-token, Authorization',
		);
	});

	it('should handle CORS if enabled to specific origin', async () => {
		const ajv = new Ajv();
		const app = express();
		const api = new Router('/api');
		const settings = new CachedSettings();

		settings.set({
			_id: 'API_Enable_CORS',
			value: true,
		} as any);
		settings.set({
			_id: 'API_CORS_Origin',
			value: 'http://localhost',
		} as any);

		api.use(cors(settings)).get(
			'/test',
			{
				response: {
					200: ajv.compile({
						type: 'object',
						properties: {
							message: { type: 'string' },
						},
					}),
				},
			},
			async () => {
				return {
					statusCode: 200,
					body: {
						message: 'CORS test successful',
					},
				};
			},
		);

		app.use(api.router);

		const response = await request(app).options('/api/test').set('origin', 'http://localhost');

		expect(response.statusCode).toBe(200);
		expect(response.body).not.toHaveProperty('message', 'CORS test successful');
		expect(response.headers).toHaveProperty('access-control-allow-origin', 'http://localhost');
		expect(response.headers).toHaveProperty('access-control-allow-methods', 'GET, POST, PUT, DELETE, HEAD, PATCH');
		expect(response.headers).toHaveProperty(
			'access-control-allow-headers',
			'Origin, X-Requested-With, Content-Type, Accept, X-User-Id, X-Auth-Token, x-visitor-token, Authorization',
		);
	});

	it('should not handle CORS if origin is not allowed', async () => {
		const ajv = new Ajv();
		const app = express();
		const api = new Router('/api');
		const settings = new CachedSettings();

		settings.set({
			_id: 'API_Enable_CORS',
			value: true,
		} as any);
		settings.set({
			_id: 'API_CORS_Origin',
			value: 'http://localhost',
		} as any);

		api.use(cors(settings)).get(
			'/test',
			{
				response: {
					200: ajv.compile({
						type: 'object',
						properties: {
							message: { type: 'string' },
						},
					}),
				},
			},
			async () => {
				return {
					statusCode: 200,
					body: {
						message: 'CORS test successful',
					},
				};
			},
		);

		app.use(api.router);

		const response = await request(app).options('/api/test').set('origin', 'http://example.com');

		expect(response.statusCode).toBe(403);
	});

	it('should not handle CORS if disabled', async () => {
		const ajv = new Ajv();
		const app = express();
		const api = new Router('/api');
		const settings = new CachedSettings();

		settings.set({
			_id: 'API_Enable_CORS',
			value: false,
		} as any);

		api.use(cors(settings)).get(
			'/test',
			{
				response: {
					200: ajv.compile({
						type: 'object',
						properties: {
							message: { type: 'string' },
						},
					}),
				},
			},
			async () => {
				return {
					statusCode: 200,
					body: {
						message: 'CORS test successful',
					},
				};
			},
		);

		app.use(api.router);

		const response = await request(app).options('/api/test').set('origin', 'http://localhost');

		expect(response.statusCode).toBe(405);
		expect(response.text).toBe('CORS not enabled. Go to "Admin > General > REST Api" to enable it.');
		expect(response.headers).not.toHaveProperty('access-control-allow-origin');
	});
});
