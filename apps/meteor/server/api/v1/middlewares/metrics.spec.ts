import { Router } from '@rocket.chat/http-router';
import Ajv from 'ajv';
import express from 'express';
import request from 'supertest';

import { metricsMiddleware } from './metrics';
import { CachedSettings } from '../../../settings/CachedSettings';

describe('Metrics middleware', () => {
	it('should handle metrics', async () => {
		const ajv = new Ajv();
		const app = express();
		const api = new Router('/api');
		const settings = new CachedSettings();
		settings.set({
			_id: 'Prometheus_API_User_Agent',
			value: true,
		} as any);

		const summary = {
			startTimer: jest.fn().mockImplementation(() => jest.fn()),
		};

		// Get the mock startTimer function
		const mockEndTimer = jest.fn();
		summary.startTimer.mockReturnValue(mockEndTimer);

		const histogram = { startTimer: jest.fn().mockReturnValue(jest.fn()) };
		const responseSizeHistogram = { observe: jest.fn() };
		const activeRequestsGauge = { inc: jest.fn(), dec: jest.fn() };

		api
			.use(
				metricsMiddleware({
					api: { version: 1 } as any,
					settings,
					endpointTimeSummary: summary as any,
					endpointTimeHistogram: histogram as any,
					responseSizeHistogram: responseSizeHistogram as any,
					activeRequestsGauge: activeRequestsGauge as any,
				}),
			)
			.get(
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
							message: 'Metrics test successful',
						},
					};
				},
			);
		app.use(api.router);
		const response = await request(app).get('/api/test').set('user-agent', 'test');
		expect(response.statusCode).toBe(200);
		expect(response.body).toHaveProperty('message', 'Metrics test successful');

		expect(summary.startTimer).toHaveBeenCalledTimes(1);
		expect(mockEndTimer).toHaveBeenCalledWith({ status: 200, method: 'get', version: 1, user_agent: 'test', entrypoint: '/api/test' });
	});

	it('should strip path from metrics', async () => {
		const ajv = new Ajv();
		const app = express();
		const api = new Router('/api');
		const settings = new CachedSettings();
		settings.set({
			_id: 'Prometheus_API_User_Agent',
			value: true,
		} as any);

		const summary = {
			startTimer: jest.fn().mockImplementation(() => jest.fn()),
		};

		// Get the mock startTimer function
		const mockEndTimer = jest.fn();
		summary.startTimer.mockReturnValue(mockEndTimer);

		const histogram = { startTimer: jest.fn().mockReturnValue(jest.fn()) };
		const responseSizeHistogram = { observe: jest.fn() };
		const activeRequestsGauge = { inc: jest.fn(), dec: jest.fn() };

		api
			.use(
				metricsMiddleware({
					basePathRegex: new RegExp(/^\/api\//),
					api: { version: 1 } as any,
					settings,
					endpointTimeSummary: summary as any,
					endpointTimeHistogram: histogram as any,
					responseSizeHistogram: responseSizeHistogram as any,
					activeRequestsGauge: activeRequestsGauge as any,
				}),
			)
			.get(
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
							message: 'Metrics test successful',
						},
					};
				},
			);
		app.use(api.router);
		const response = await request(app).get('/api/test').set('user-agent', 'test');
		expect(response.statusCode).toBe(200);
		expect(response.body).toHaveProperty('message', 'Metrics test successful');

		expect(summary.startTimer).toHaveBeenCalledTimes(1);
		expect(mockEndTimer).toHaveBeenCalledWith({ status: 200, method: 'get', version: 1, user_agent: 'test', entrypoint: 'test' });
	});

	it('should decode path for method.call endpoints', async () => {
		const ajv = new Ajv();
		const app = express();
		const settings = new CachedSettings();

		const api = new Router('/api');

		const summary = {
			startTimer: jest.fn().mockImplementation(() => jest.fn()),
		};

		// Get the mock startTimer function
		const mockEndTimer = jest.fn();
		summary.startTimer.mockReturnValue(mockEndTimer);

		const histogram = { startTimer: jest.fn().mockReturnValue(jest.fn()) };
		const responseSizeHistogram = { observe: jest.fn() };
		const activeRequestsGauge = { inc: jest.fn(), dec: jest.fn() };

		api
			.use(
				metricsMiddleware({
					basePathRegex: new RegExp(/^\/api\//),
					api: { version: 1 } as any,
					settings,
					endpointTimeSummary: summary as any,
					endpointTimeHistogram: histogram as any,
					responseSizeHistogram: responseSizeHistogram as any,
					activeRequestsGauge: activeRequestsGauge as any,
				}),
			)
			.get(
				'/method.call/:id',
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
							message: `Metrics test successful`,
						},
					};
				},
			);
		app.use(api.router);
		const response = await request(app).get('/api/method.call/get%3Aparam').set('user-agent', 'test');
		expect(response.statusCode).toBe(200);
		expect(response.body).toHaveProperty('message', 'Metrics test successful');

		expect(summary.startTimer).toHaveBeenCalledTimes(1);
		expect(mockEndTimer).toHaveBeenCalledWith({
			status: 200,
			method: 'get',
			version: 1,
			entrypoint: 'method.call/get:param',
		});
	});

	it('should only record requests matching its own base path', async () => {
		const ajv = new Ajv();
		const app = express();
		const settings = new CachedSettings();

		const makeMetrics = () => {
			const endTimer = jest.fn();
			return {
				endTimer,
				summary: { startTimer: jest.fn().mockReturnValue(endTimer) },
				histogram: { startTimer: jest.fn().mockReturnValue(jest.fn()) },
				responseSizeHistogram: { observe: jest.fn() },
				activeRequestsGauge: { inc: jest.fn(), dec: jest.fn() },
			};
		};

		const v1Metrics = makeMetrics();
		const experimentalMetrics = makeMetrics();

		const route = (router: Router<any, any, any>) =>
			router.get(
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
				async () => ({
					statusCode: 200,
					body: { message: 'Metrics test successful' },
				}),
			);

		const api = new Router('/api');

		api
			.use(
				metricsMiddleware({
					basePathRegex: new RegExp(/^\/api\/v1\//),
					api: { version: 'v1' } as any,
					settings,
					endpointTimeSummary: v1Metrics.summary as any,
					endpointTimeHistogram: v1Metrics.histogram as any,
					responseSizeHistogram: v1Metrics.responseSizeHistogram as any,
					activeRequestsGauge: v1Metrics.activeRequestsGauge as any,
				}),
			)
			.use(
				metricsMiddleware({
					basePathRegex: new RegExp(/^\/api\/experimental\//),
					api: { version: 'experimental' } as any,
					settings,
					endpointTimeSummary: experimentalMetrics.summary as any,
					endpointTimeHistogram: experimentalMetrics.histogram as any,
					responseSizeHistogram: experimentalMetrics.responseSizeHistogram as any,
					activeRequestsGauge: experimentalMetrics.activeRequestsGauge as any,
				}),
			)
			.use(route(new Router('/v1')))
			.use(route(new Router('/experimental')));

		app.use(api.router);

		expect((await request(app).get('/api/v1/test')).statusCode).toBe(200);

		expect(v1Metrics.summary.startTimer).toHaveBeenCalledTimes(1);
		expect(v1Metrics.endTimer).toHaveBeenCalledWith({ status: 200, method: 'get', version: 'v1', entrypoint: 'test' });
		expect(experimentalMetrics.summary.startTimer).not.toHaveBeenCalled();
		expect(experimentalMetrics.activeRequestsGauge.inc).not.toHaveBeenCalled();

		expect((await request(app).get('/api/experimental/test')).statusCode).toBe(200);

		expect(experimentalMetrics.summary.startTimer).toHaveBeenCalledTimes(1);
		expect(experimentalMetrics.endTimer).toHaveBeenCalledWith({
			status: 200,
			method: 'get',
			version: 'experimental',
			entrypoint: 'test',
		});
		expect(v1Metrics.summary.startTimer).toHaveBeenCalledTimes(1);
	});
});
