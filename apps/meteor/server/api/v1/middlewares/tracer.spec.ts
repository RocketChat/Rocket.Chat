import { Router } from '@rocket.chat/http-router';
import Ajv from 'ajv';
import express from 'express';
import request from 'supertest';

import { tracerSpanMiddleware } from './tracer';

jest.mock('@rocket.chat/tracing', () => ({
	isTracingEnabled: jest.fn(),
	tracerSpan: jest.fn(),
}));

const { isTracingEnabled, tracerSpan } = jest.requireMock('@rocket.chat/tracing');

const buildApp = () => {
	const ajv = new Ajv();
	const app = express();
	const api = new Router('/api');

	api.use(tracerSpanMiddleware).get(
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
					message: 'Tracer test successful',
				},
			};
		},
	);
	app.use(api.router);

	return app;
};

describe('Tracer middleware', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should not start a span nor touch the request when tracing is disabled', async () => {
		isTracingEnabled.mockReturnValue(false);

		const response = await request(buildApp()).get('/api/test');

		expect(response.statusCode).toBe(200);
		expect(response.body).toHaveProperty('message', 'Tracer test successful');
		expect(tracerSpan).not.toHaveBeenCalled();
		expect(response.headers).not.toHaveProperty('x-trace-id');
	});

	it('should wrap the request in a span and expose the trace id when tracing is enabled', async () => {
		isTracingEnabled.mockReturnValue(true);

		const setAttribute = jest.fn();
		tracerSpan.mockImplementation((_name: string, _options: unknown, fn: (span: unknown) => unknown) =>
			fn({
				spanContext: () => ({ traceId: 'trace-id-123' }),
				setAttribute,
			}),
		);

		const response = await request(buildApp()).get('/api/test');

		expect(response.statusCode).toBe(200);
		expect(tracerSpan).toHaveBeenCalledTimes(1);
		expect(tracerSpan).toHaveBeenCalledWith(
			expect.stringContaining('GET'),
			expect.objectContaining({ attributes: expect.objectContaining({ method: 'GET' }) }),
			expect.any(Function),
		);
		expect(response.headers).toHaveProperty('x-trace-id', 'trace-id-123');
		expect(setAttribute).toHaveBeenCalledWith('status', 200);
	});
});
