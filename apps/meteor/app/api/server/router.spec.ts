import Ajv from 'ajv';
import express from 'express';
import request from 'supertest';

import { Router } from './router';

describe('Router use method', () => {
	it('middleware should be applied only on the right path', async () => {
		const ajv = new Ajv();
		const app = express();
		const api = new Router('/api');
		const v1 = new Router('/v1').use(async (x, next) => {
			x.header('x-api-version', 'v1');
			await next();
		});
		const v2 = new Router('/v2');
		const test = new Router('/test').get(
			'/',
			{
				response: {
					200: ajv.compile({
						type: 'object',
						properties: {
							customProperty: { type: 'string' },
						},
					}),
				},
			},
			async (request) => {
				return {
					statusCode: 200,
					body: {
						customProperty: (request as any).customProperty,
					},
				};
			},
		);

		app.use(api.use(v1.use(test)).use(v2.use(test)).router);

		const response1 = await request(app).get('/api/v1/test');

		expect(response1.statusCode).toBe(200);
		expect(response1.headers).toHaveProperty('x-api-version', 'v1');

		const response2 = await request(app).get('/api/v2/test');

		expect(response2.statusCode).toBe(200);
		expect(response2.headers).not.toHaveProperty('x-api-version');
	});
});
