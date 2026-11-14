import { EventEmitter } from 'node:events';

import type { Logger } from '@rocket.chat/logger';
import type { Request, Response } from 'express';

import { nodeLoggerMiddleware } from './logger';

const createLogger = () => {
	const http = jest.fn();
	const child = jest.fn(() => ({ http }));
	return { logger: { logger: { child } } as unknown as Logger, child, http };
};

const createRequest = (originalUrl: string): Request =>
	({
		method: 'GET',
		originalUrl,
		url: originalUrl,
		headers: {
			'host': 'open.rocket.chat',
			'user-agent': 'curl/8',
			'x-user-id': 'user-id',
		},
		socket: { remoteAddress: '10.0.0.1' },
	}) as unknown as Request;

const createResponse = (statusCode = 200, { headersSent = true, writableFinished = true } = {}): Response =>
	Object.assign(new EventEmitter(), { statusCode, headersSent, writableFinished }) as unknown as Response;

describe('nodeLoggerMiddleware', () => {
	it('logs the request fields and calls next before the response ends', () => {
		const { logger, child, http } = createLogger();
		const next = jest.fn();

		nodeLoggerMiddleware(logger)(createRequest('/_matrix/federation/v1/version'), createResponse(), next);

		expect(next).toHaveBeenCalled();
		expect(http).not.toHaveBeenCalled();
		expect(child).toHaveBeenCalledWith({
			method: 'GET',
			url: 'http://localhost/_matrix/federation/v1/version',
			userId: 'user-id',
			userAgent: 'curl/8',
			length: undefined,
			host: 'open.rocket.chat',
			referer: undefined,
			remoteIP: '10.0.0.1',
		});
	});

	it('logs the status once, even when both finish and close fire', () => {
		const { logger, http } = createLogger();
		const res = createResponse(404);

		nodeLoggerMiddleware(logger)(createRequest('/health'), res, jest.fn());
		res.emit('finish');
		res.emit('close');

		expect(http).toHaveBeenCalledTimes(1);
		expect(http).toHaveBeenCalledWith({ status: 404, responseTime: expect.any(Number) });
	});

	it('logs no status when the connection closed before the headers were sent', () => {
		const { logger, http } = createLogger();
		const res = createResponse(200, { headersSent: false, writableFinished: false });

		nodeLoggerMiddleware(logger)(createRequest('/health'), res, jest.fn());
		res.emit('close');

		expect(http).toHaveBeenCalledTimes(1);
		expect(http).toHaveBeenCalledWith({ status: undefined, aborted: true, responseTime: expect.any(Number) });
	});

	it('logs the sent status when the connection closed while the body was being written', () => {
		const { logger, http } = createLogger();
		const res = createResponse(503, { headersSent: true, writableFinished: false });

		nodeLoggerMiddleware(logger)(createRequest('/health'), res, jest.fn());
		res.emit('close');

		expect(http).toHaveBeenCalledWith({ status: 503, aborted: true, responseTime: expect.any(Number) });
	});

	it('censors the URL', () => {
		const { logger, child } = createLogger();

		nodeLoggerMiddleware(logger)(createRequest('/_oauth/google?code=secret&state=abc'), createResponse(), jest.fn());

		expect(child).toHaveBeenCalledWith(expect.objectContaining({ url: 'http://localhost/_oauth/google?code=*Redacted*&state=abc' }));
	});

	it('applies the censor of the route', () => {
		const { logger, child } = createLogger();

		nodeLoggerMiddleware(logger, { censor: (url) => url.replace('hash', '*Redacted*') })(
			createRequest('/api/apps/private/app-id/hash/endpoint'),
			createResponse(),
			jest.fn(),
		);

		expect(child).toHaveBeenCalledWith(expect.objectContaining({ url: 'http://localhost/api/apps/private/app-id/*Redacted*/endpoint' }));
	});

	it('censors the referer like the URL', () => {
		const { logger, child } = createLogger();
		const req = createRequest('/api/apps/private/app-id/hash/style.css');
		req.headers.referer = 'https://open.rocket.chat/api/apps/private/app-id/hash/page?code=secret';

		nodeLoggerMiddleware(logger, { censor: (url) => url.replace('hash', '*Redacted*') })(req, createResponse(), jest.fn());

		expect(child).toHaveBeenCalledWith(
			expect.objectContaining({ referer: 'https://open.rocket.chat/api/apps/private/app-id/*Redacted*/page?code=*Redacted*' }),
		);
	});
});
