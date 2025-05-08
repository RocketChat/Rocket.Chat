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

	it('should parse nested query params into object for GET requests', async () => {
		const ajv = new Ajv();
		const app = express();

		const isTestQueryParams = ajv.compile({
			type: 'object',
			properties: {
				outerProperty: { type: 'object', properties: { innerProperty: { type: 'string' } } },
			},
			additionalProperties: false,
		});

		const api = new Router('/api').get(
			'/test',
			{
				response: {
					200: isTestQueryParams,
				},
				query: isTestQueryParams,
			},
			async function action() {
				const { outerProperty } = this.queryParams as any;
				return {
					statusCode: 200,
					body: {
						outerProperty,
					},
				};
			},
		);

		app.use(api.router);

		const response1 = await request(app).get('/api/test?outerProperty[innerProperty]=test');

		expect(response1.statusCode).toBe(200);
		expect(response1.body).toHaveProperty('outerProperty');
		expect(response1.body.outerProperty).toHaveProperty('innerProperty', 'test');
	});
});
