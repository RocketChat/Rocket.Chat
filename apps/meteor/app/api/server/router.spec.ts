import { Readable, PassThrough } from 'stream';

import Ajv from 'ajv';
import type { Request, Response as ExpressResponse } from 'express';
import express from 'express';
import type { Hono } from 'hono';
import request from 'supertest';

import { honoAdapter } from './middlewares/honoAdapter';
import { Router } from './router';

// Helper to create a ReadableStream from a string
const stringToReadableStream = (str: string): ReadableStream<Uint8Array> => {
	const encoder = new TextEncoder();
	return new ReadableStream({
		start(controller) {
			controller.enqueue(encoder.encode(str));
			controller.close();
		},
	});
};

// Helper to create a ReadableStream from a Buffer
const bufferToReadableStream = (buffer: Buffer): ReadableStream<Uint8Array> => {
	return new ReadableStream({
		start(controller) {
			controller.enqueue(new Uint8Array(buffer));
			controller.close();
		},
	});
};

// Helper to create a mock Express Response that captures piped data
const createMockResponse = () => {
	const passthrough = new PassThrough();
	const chunks: Buffer[] = [];
	passthrough.on('data', (chunk) => chunks.push(Buffer.from(chunk)));

	// Explicitly type the mockRes before casting to Response
	const mockResBase = passthrough as any;
	mockResBase.status = jest.fn().mockReturnThis();
	mockResBase.setHeader = jest.fn().mockReturnThis();
	mockResBase.send = jest.fn().mockReturnThis();
	mockResBase.getHeader = jest.fn();
	mockResBase.getHeaders = jest.fn();

	const getOutputBuffer = () => Buffer.concat(chunks);
	const getOutputString = (encoding: BufferEncoding = 'utf-8') => getOutputBuffer().toString(encoding);

	return { mockRes: mockResBase as ExpressResponse, getOutputBuffer, getOutputString };
};

describe('Router use method', () => {
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

describe('honoAdapter', () => {
	let mockHono: Hono;
	let mockExpressRequest: Request;

	beforeEach(() => {
		mockHono = {
			request: jest.fn(),
		} as unknown as Hono;

		mockExpressRequest = {
			originalUrl: '/test',
			method: 'GET',
			headers: { 'x-test-header': 'test-value' },
			body: undefined, // Default, can be overridden
			on: jest.fn(), // To satisfy Readable.isDisturbed check if it uses .on
			readable: true, // To satisfy Readable.isDisturbed if it checks this
			socket: { encrypted: false } as any, // for duplex='half' related logic potentially
		} as unknown as Request;
		(mockExpressRequest as any).duplex = 'half'; // Initialize duplex as honoAdapter expects it
	});

	it('should adapt a Hono response with JSON body', async () => {
		const jsonData = { message: 'hello' };
		const jsonString = JSON.stringify(jsonData);
		const mockHonoResponse = new Response(stringToReadableStream(jsonString), {
			status: 200,
			headers: { 'content-type': 'application/json' },
		});
		(mockHono.request as jest.Mock).mockResolvedValue(mockHonoResponse);

		const { mockRes, getOutputString } = createMockResponse();
		const adapter = honoAdapter(mockHono);

		await adapter(mockExpressRequest, mockRes);

		expect(mockHono.request).toHaveBeenCalledWith(
			'/test',
			expect.objectContaining({
				method: 'GET',
				headers: expect.any(Headers),
			}),
			expect.anything(),
		);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'application/json');

		// Wait for the stream to finish piping
		await new Promise((resolve) => (mockRes as any).on('finish', resolve));
		expect(getOutputString()).toBe(jsonString);
	});

	it('should adapt a Hono response with text body', async () => {
		const textData = 'Hello, world!';
		const mockHonoResponse = new Response(stringToReadableStream(textData), {
			status: 201,
			headers: { 'content-type': 'text/plain' },
		});
		(mockHono.request as jest.Mock).mockResolvedValue(mockHonoResponse);

		const { mockRes, getOutputString } = createMockResponse();
		const adapter = honoAdapter(mockHono);

		await adapter(mockExpressRequest, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(201);
		expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'text/plain');
		await new Promise((resolve) => (mockRes as any).on('finish', resolve));
		expect(getOutputString()).toBe(textData);
	});

	it('should adapt a Hono response with image (Buffer) body', async () => {
		const imageBuffer = Buffer.from([1, 2, 3, 4, 5]); // Sample image data
		const mockHonoResponse = new Response(bufferToReadableStream(imageBuffer), {
			status: 200,
			headers: { 'content-type': 'image/png' },
		});
		(mockHono.request as jest.Mock).mockResolvedValue(mockHonoResponse);

		const { mockRes, getOutputBuffer } = createMockResponse();
		const adapter = honoAdapter(mockHono);

		await adapter(mockExpressRequest, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'image/png');
		await new Promise((resolve) => (mockRes as any).on('finish', resolve));
		expect(getOutputBuffer()).toEqual(imageBuffer);
	});

	it('should adapt a Hono response with no body', async () => {
		const mockHonoResponse = new Response(null, {
			status: 204,
			headers: { 'x-custom-header': 'empty' },
		});
		(mockHono.request as jest.Mock).mockResolvedValue(mockHonoResponse);

		const { mockRes, getOutputString } = createMockResponse();
		const adapter = honoAdapter(mockHono);

		await adapter(mockExpressRequest, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(204);
		expect(mockRes.setHeader).toHaveBeenCalledWith('x-custom-header', 'empty');
		await new Promise((resolve) => (mockRes as any).on('finish', resolve));
		expect(getOutputString()).toBe('');
	});

	it('should handle POST request with body', async () => {
		const postBody = { data: 'some data' };
		const postBodyString = JSON.stringify(postBody);

		const mockPostRequest = {
			...mockExpressRequest,
			method: 'POST',
			body: Readable.from(postBodyString) as any,
			headers: { 'content-type': 'application/json', 'content-length': String(postBodyString.length) },
		} as Request;
		(mockPostRequest as any).duplex = 'half';

		const mockHonoResponse = new Response(stringToReadableStream('{"status":"ok"}'), {
			status: 200,
			headers: { 'content-type': 'application/json' },
		});
		(mockHono.request as jest.Mock).mockResolvedValue(mockHonoResponse);

		const { mockRes, getOutputString } = createMockResponse();
		const adapter = honoAdapter(mockHono);

		await adapter(mockPostRequest, mockRes);

		expect(mockHono.request).toHaveBeenCalledWith(
			'/test',
			expect.objectContaining({
				method: 'POST',
				body: expect.anything(),
				headers: expect.any(Headers),
			}),
			expect.anything(),
		);
		const calledWithHeaders = (mockHono.request as jest.Mock).mock.calls[0][1].headers as Headers;
		expect(calledWithHeaders.get('content-type')).toBe('application/json');

		expect(mockRes.status).toHaveBeenCalledWith(200);
		await new Promise((resolve) => (mockRes as any).on('finish', resolve));
		expect(getOutputString()).toBe('{"status":"ok"}');
	});

	it('should correctly set duplex and handle isDisturbed for request stream', async () => {
		const mockHonoResponse = new Response(null, { status: 204 });
		(mockHono.request as jest.Mock).mockResolvedValue(mockHonoResponse);

		const { mockRes } = createMockResponse();
		const adapter = honoAdapter(mockHono);

		mockExpressRequest.on = jest.fn();
		Object.defineProperty(mockExpressRequest, 'readableFlowing', { value: null, writable: true });

		jest.spyOn(Readable, 'isDisturbed').mockReturnValue(false);
		await adapter(mockExpressRequest, mockRes);
		expect((mockExpressRequest as any).duplex).toBe('half');
		expect(mockHono.request).toHaveBeenCalledTimes(1);

		(mockHono.request as jest.Mock).mockClear();
		jest.spyOn(Readable, 'isDisturbed').mockReturnValue(true);
		await adapter(mockExpressRequest, mockRes);
		expect(mockHono.request).not.toHaveBeenCalled();

		jest.restoreAllMocks();
	});
});
