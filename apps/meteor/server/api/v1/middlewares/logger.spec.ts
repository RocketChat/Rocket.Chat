import { Router } from '@rocket.chat/http-router';
import type { Logger } from '@rocket.chat/logger';
import Ajv from 'ajv';
import express from 'express';
import request from 'supertest';

import { loggerMiddleware } from './logger';

const buildApp = (logger: Logger) => {
	const ajv = new Ajv();
	const app = express();
	const api = new Router('/api');

	api.use(loggerMiddleware(logger)).get(
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
					message: 'Logger test successful',
				},
			};
		},
	);
	app.use(api.router);

	return app;
};

const buildLoggerMock = ({ httpEnabled }: { httpEnabled: boolean }) => {
	const http = jest.fn();
	const child = jest.fn().mockReturnValue({ http });
	const isLevelEnabled = jest.fn().mockImplementation((level: string) => (level === 'http' ? httpEnabled : true));

	return {
		logger: { logger: { child, isLevelEnabled } },
		mocks: { http, child, isLevelEnabled },
	};
};

describe('Logger middleware', () => {
	it('should not create a child logger when the http level is disabled', async () => {
		const { logger, mocks } = buildLoggerMock({ httpEnabled: false });

		const response = await request(buildApp(logger as unknown as Logger)).get('/api/test');

		expect(response.statusCode).toBe(200);
		expect(response.body).toHaveProperty('message', 'Logger test successful');
		expect(mocks.child).not.toHaveBeenCalled();
		expect(mocks.http).not.toHaveBeenCalled();
	});

	it('should log the request when the http level is enabled', async () => {
		const { logger, mocks } = buildLoggerMock({ httpEnabled: true });

		const response = await request(buildApp(logger as unknown as Logger)).get('/api/test');

		expect(response.statusCode).toBe(200);
		expect(mocks.child).toHaveBeenCalledTimes(1);
		expect(mocks.child).toHaveBeenCalledWith(
			expect.objectContaining({ method: 'GET', url: expect.any(String) }),
			expect.objectContaining({ redact: expect.any(Array) }),
		);
		expect(mocks.http).toHaveBeenCalledWith(expect.objectContaining({ status: 200, responseTime: expect.any(Number) }));
	});
});
