import Ajv from 'ajv';
import express from 'express';
import request from 'supertest';

import { Router } from './Router';

describe('Router', () => {
	const ajv = new Ajv();
	const dummyValidator = ajv.compile({
		type: 'object',
		additionalProperties: true,
	});

	describe('Basic routing', () => {
		it('should handle GET requests', async () => {
			const app = express();
			const api = new Router('/api');

			api.get(
				'hello',
				{
					response: {
						200: dummyValidator,
					},
				},
				async () => ({
					statusCode: 200,
					body: { message: 'Hello, World!' },
				}),
			);

			app.use(api.router);

			const response = await request(app).get('/api/hello');

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ message: 'Hello, World!' });
		});

		it('should handle POST requests', async () => {
			const app = express();
			const api = new Router('/api');

			api.post(
				'echo',
				{
					response: {
						201: dummyValidator,
					},
				},
				async (c) => {
					const bodyParams = await c.req.json();
					return {
						statusCode: 201,
						body: { received: bodyParams },
					};
				},
			);

			app.use(api.router);

			const testData = { message: 'Hello from POST' };
			const response = await request(app).post('/api/echo').send(testData);

			expect(response.status).toBe(201);
			expect(response.body).toEqual({ received: testData });
		});

		it('should handle PUT requests', async () => {
			const app = express();
			const api = new Router('/api');

			api.put(
				'update/:id',
				{
					response: {
						200: dummyValidator,
					},
				},
				async (c) => {
					const id = c.req.param('id');
					const bodyParams = await c.req.json();

					return {
						statusCode: 200,
						body: {
							id,
							updated: bodyParams,
						},
					};
				},
			);

			app.use(api.router);

			const testData = { name: 'Updated Resource' };
			const response = await request(app).put('/api/update/123').send(testData);

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ id: '123', updated: testData });
		});

		it('should handle DELETE requests', async () => {
			const app = express();
			const api = new Router('/api');

			api.delete(
				'remove/:id',
				{
					response: {
						200: dummyValidator,
					},
				},
				async (c) => {
					const id = c.req.param('id');

					return {
						statusCode: 200,
						body: { deleted: id },
					};
				},
			);

			app.use(api.router);

			const response = await request(app).delete('/api/remove/123');

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ deleted: '123' });
		});
	});

	describe('Validation', () => {
		it('should validate query parameters', async () => {
			const ajv = new Ajv();
			const app = express();
			const api = new Router('/api');

			api.get(
				'validate-query',
				{
					query: ajv.compile({
						type: 'object',
						properties: {
							required: { type: 'string' },
						},
						required: ['required'],
						additionalProperties: false,
					}),
					response: {
						200: dummyValidator,
						400: dummyValidator,
					},
				},
				async () => ({
					statusCode: 200,
					body: { success: true },
				}),
			);

			app.use(api.router);

			const validResponse = await request(app).get('/api/validate-query?required=value');

			expect(validResponse.status).toBe(200);

			const invalidResponse = await request(app).get('/api/validate-query');

			expect(invalidResponse.status).toBe(400);
			expect(invalidResponse.body).toHaveProperty('errorType', 'error-invalid-params');
		});

		it('should validate request body', async () => {
			const ajv = new Ajv();
			const app = express();
			const api = new Router('/api');

			api.post(
				'validate-body',
				{
					body: ajv.compile({
						type: 'object',
						properties: {
							name: { type: 'string' },
							age: { type: 'number' },
						},
						required: ['name', 'age'],
						additionalProperties: false,
					}),
					response: {
						200: dummyValidator,
						400: dummyValidator,
					},
				},
				async () => ({
					statusCode: 200,
					body: { success: true },
				}),
			);

			app.use(api.router);

			const validResponse = await request(app).post('/api/validate-body').send({ name: 'John', age: 30 });

			expect(validResponse.status).toBe(200);

			const invalidResponse = await request(app).post('/api/validate-body').send({ name: 'John' });

			expect(invalidResponse.status).toBe(400);
			expect(invalidResponse.body).toHaveProperty('errorType', 'error-invalid-params');

			const invalidTypeResponse = await request(app).post('/api/validate-body').send({ name: 'John', age: 'thirty' });

			expect(invalidTypeResponse.status).toBe(400);
			expect(invalidTypeResponse.body).toHaveProperty('errorType', 'error-invalid-params');
		});

		it('should validate response body in test mode', async () => {
			process.env.TEST_MODE = 'true';
			const ajv = new Ajv();
			const app = express();
			const api = new Router('/api');

			api.get(
				'validate-response',
				{
					typed: true,
					response: {
						200: ajv.compile({
							type: 'object',
							properties: {
								result: { type: 'string' },
							},
							required: ['result'],
							additionalProperties: false,
						}),
					},
				},
				async () => ({
					statusCode: 200,
					body: { wrongField: 'wrong' },
				}),
			);

			app.use(api.router);

			const response = await request(app).get('/api/validate-response');

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty('errorType', 'error-invalid-body');

			delete process.env.TEST_MODE;
		});
	});

	describe('Middleware', () => {
		it('should apply middleware to routes', async () => {
			const app = express();
			const api = new Router('/api');

			const authMiddleware = async (c: any, next: () => Promise<void>) => {
				const token = c.req.header('Authorization');

				if (!token || token !== 'Bearer valid-token') {
					return c.json(
						{
							success: false,
							errorType: 'unauthorized',
							error: 'Unauthorized access',
						},
						401,
					);
				}

				c.set('userId', 'user-123');
				await next();
			};

			api.get(
				'protected',
				{
					response: {
						200: dummyValidator,
						401: dummyValidator,
					},
				},
				authMiddleware,
				async (c) => {
					const userId = c.get('userId');

					return {
						statusCode: 200,
						body: { userId, message: 'Protected resource accessed' },
					};
				},
			);

			app.use(api.router);

			const unauthorizedResponse = await request(app).get('/api/protected');

			expect(unauthorizedResponse.status).toBe(401);

			const authorizedResponse = await request(app).get('/api/protected').set('Authorization', 'Bearer valid-token');

			expect(authorizedResponse.status).toBe(200);
			expect(authorizedResponse.body).toEqual({
				userId: 'user-123',
				message: 'Protected resource accessed',
			});
		});

		it('should support global middleware via use()', async () => {
			const app = express();
			const api = new Router('/api');

			api.use(async (c, next) => {
				c.set('requestTime', 'test-time');
				await next();
			});

			api.get(
				'time',
				{
					response: {
						200: dummyValidator,
					},
				},
				async (c) => {
					const time = c.get('requestTime');

					return {
						statusCode: 200,
						body: { time },
					};
				},
			);

			app.use(api.router);

			const response = await request(app).get('/api/time');

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ time: 'test-time' });
		});
	});

	describe('Nested routers', () => {
		it('should support nested routers with the use() method', async () => {
			const app = express();
			const api = new Router('/api');
			const v1 = new Router('/v1');
			const users = new Router('/users');

			users.get(
				':id',
				{
					response: {
						200: dummyValidator,
					},
				},
				async (c) => {
					const id = c.req.param('id');
					return {
						statusCode: 200,
						body: { userId: id },
					};
				},
			);

			v1.use(users);
			api.use(v1);

			app.use(api.router);

			const response = await request(app).get('/api/v1/users/123');

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ userId: '123' });
		});

		it('should pass middleware from parent to child routers', async () => {
			const app = express();
			const api = new Router('/api');
			const v1 = new Router('/v1');

			v1.use(async (c, next) => {
				c.header('API-Version', 'v1');
				await next();
			});

			v1.get(
				'info',
				{
					response: {
						200: dummyValidator,
					},
				},
				async () => ({
					statusCode: 200,
					body: { version: 'v1' },
				}),
			);

			api.use(v1);
			app.use(api.router);

			const response = await request(app).get('/api/v1/info');

			expect(response.status).toBe(200);
			expect(response.headers).toHaveProperty('api-version', 'v1');
			expect(response.body).toEqual({ version: 'v1' });
		});
	});

	describe('Error handling', () => {
		it('should handle errors thrown in route handlers', async () => {
			const app = express();
			const api = new Router('/api');

			const originalConsoleError = console.error;
			console.error = jest.fn();

			api.get(
				'error',
				{
					response: {
						200: dummyValidator,
						500: dummyValidator,
					},
				},
				async () => {
					throw new Error('Test error');
				},
			);

			app.use(api.router);

			try {
				const response = await request(app).get('/api/error');
				expect(response.status).toBe(500);
			} finally {
				console.error = originalConsoleError;
			}
		});
	});

	describe('Content types', () => {
		it('should handle different content types for requests', async () => {
			const app = express();
			const api = new Router('/api');

			api.post(
				'form-data',
				{
					response: {
						200: dummyValidator,
					},
				},
				async (c) => {
					const formData = await c.req.formData();
					const name = formData.get('name');

					return {
						statusCode: 200,
						body: { received: { name } },
					};
				},
			);

			app.use(api.router);

			const response = await request(app).post('/api/form-data').field('name', 'Test User');

			expect(response.status).toBe(200);
			expect(response.body).toEqual({ received: { name: 'Test User' } });
		});

		it('should set custom response headers', async () => {
			const app = express();
			const api = new Router('/api');

			api.get(
				'custom-headers',
				{
					response: {
						200: dummyValidator,
					},
				},
				async () => ({
					statusCode: 200,
					body: { message: 'With custom headers' },
					headers: {
						'X-Custom-Header': 'custom-value',
						'Cache-Control': 'private, max-age=3600',
					},
				}),
			);

			app.use(api.router);

			const response = await request(app).get('/api/custom-headers');

			expect(response.status).toBe(200);
			expect(response.headers).toHaveProperty('x-custom-header', 'custom-value');
			expect(response.headers).toHaveProperty('cache-control', 'private, max-age=3600');
		});
	});

	it('should fail if the query request is not valid', async () => {
		const ajv = new Ajv();
		const app = express();
		const api = new Router('/api');
		const test = new Router('/test').get(
			'/',
			{
				typed: true,
				query: ajv.compile({
					type: 'object',
					properties: {
						customProperty: { type: 'string' },
					},
					additionalProperties: false,
					required: ['customProperty'],
				}),
				response: {
					200: ajv.compile({
						type: 'object',
						properties: {
							customProperty: { type: 'string' },
						},
						additionalProperties: false,
					}),
				},
			},
			async function action() {
				return {
					statusCode: 200,
					body: { customProperty: 'valid' }, // Ensure valid response for schema
				};
			},
		);
		app.use(api.use(test).router);
		const response = await request(app).get('/api/test');
		expect(response.statusCode).toBe(400);
		expect(response.body).toHaveProperty('error', "must have required property 'customProperty'");
	});
	it('should fail if the body request is not valid', async () => {
		const ajv = new Ajv();
		const app = express();
		const api = new Router('/api');
		const test = new Router('/test').post(
			'/',
			{
				typed: true,
				body: ajv.compile({
					type: 'object',
					properties: {
						customProperty: { type: 'string' },
					},
					additionalProperties: false,
					required: ['customProperty'],
				}),
				response: {
					200: ajv.compile({
						type: 'object',
						properties: {
							customProperty: { type: 'string' },
						},
						additionalProperties: false,
					}),
				},
			},
			async function action() {
				return {
					statusCode: 200,
					body: { customProperty: 'valid' }, // Ensure valid response for schema
				};
			},
		);
		app.use(api.use(test).router);
		const response = await request(app).post('/api/test').send({});
		expect(response.statusCode).toBe(400);
		expect(response.body).toHaveProperty('error', "must have required property 'customProperty'");
	});

	it('should fail if the body response has additional properties', async () => {
		process.env.NODE_ENV = 'test';
		process.env.TEST_MODE = 'true';
		const ajv = new Ajv();
		const app = express();
		const api = new Router('/api');
		const test = new Router('/test').get(
			'/',
			{
				typed: true,
				response: {
					200: ajv.compile({
						type: 'object',
						properties: {
							customProperty: { type: 'string' },
						},
						additionalProperties: false,
					}),
				},
			},
			async () => {
				return {
					statusCode: 200,
					body: { asda: 1 }, // This body is invalid according to the schema
				};
			},
		);
		app.use(api.use(test).router);
		const response = await request(app).get('/api/test');
		expect(response.statusCode).toBe(400);
		expect(response.body).toHaveProperty(
			'error',
			'Invalid response for endpoint GET - http://localhost/api/test. Error: must NOT have additional properties (additionalProperty: asda)',
		);
	});

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
						additionalProperties: false,
						required: ['customProperty'],
					}),
				},
			},
			async () => {
				return {
					statusCode: 200,
					body: {
						customProperty: 'customProperty',
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

	it('should fail if the delete request body is not valid', async () => {
		const ajv = new Ajv();
		const app = express();
		const api = new Router('/api');
		const test = new Router('/test').delete(
			'/',
			{
				typed: true,
				body: ajv.compile({
					type: 'object',
					properties: {
						customProperty: { type: 'string' },
					},
					additionalProperties: false,
					required: ['customProperty'],
				}),
				response: {
					200: ajv.compile({
						type: 'object',
						properties: {
							customProperty: { type: 'string' },
						},
						additionalProperties: false,
					}),
				},
			},
			async function action() {
				return {
					statusCode: 200,
					body: { customProperty: 'test' },
				};
			},
		);
		app.use(api.use(test).router);
		const response = await request(app).delete('/api/test').send({});
		expect(response.statusCode).toBe(400);
		expect(response.body).toHaveProperty('error', "must have required property 'customProperty'");
	});

	it('should fail if the put request body is not valid', async () => {
		const ajv = new Ajv();
		const app = express();
		const api = new Router('/api');
		const test = new Router('/test').put(
			'/',
			{
				typed: true,
				body: ajv.compile({
					type: 'object',
					properties: {
						customProperty: { type: 'string' },
					},
					additionalProperties: false,
					required: ['customProperty'],
				}),
				response: {
					200: ajv.compile({
						type: 'object',
						properties: {
							customProperty: { type: 'string' },
						},
						additionalProperties: false,
					}),
				},
			},
			async function action() {
				return {
					statusCode: 200,
					body: { customProperty: 'test' },
				};
			},
		);
		app.use(api.use(test).router);
		const response = await request(app).put('/api/test').send({});
		expect(response.statusCode).toBe(400);
		expect(response.body).toHaveProperty('error', "must have required property 'customProperty'");
	});
});
