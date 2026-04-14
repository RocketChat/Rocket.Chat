import { Router } from '@rocket.chat/http-router';
import Ajv from 'ajv';
import express from 'express';
import request from 'supertest';

import { metricsMiddleware } from './metrics';
import { CachedSettings } from '../../../settings/server/CachedSettings';

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

		api.use(metricsMiddleware({ api: { version: 1 } as any, settings, summary: summary as any })).get(
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

		api
			.use(metricsMiddleware({ basePathRegex: new RegExp(/^\/api\//), api: { version: 1 } as any, settings, summary: summary as any }))
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

		api
			.use(metricsMiddleware({ basePathRegex: new RegExp(/^\/api\//), api: { version: 1 } as any, settings, summary: summary as any }))
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
});
