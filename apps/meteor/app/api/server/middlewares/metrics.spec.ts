import Ajv from 'ajv';
import express from 'express';
import request from 'supertest';

import { CachedSettings } from '../../../settings/server/CachedSettings';
import { Router } from '../router';
import { metricsMiddleware } from './metrics';

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

		api.use(metricsMiddleware({ version: 1 } as any, settings, summary as any)).get(
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
		expect(mockEndTimer).toHaveBeenCalledWith({ status: 200 });
	});
});
