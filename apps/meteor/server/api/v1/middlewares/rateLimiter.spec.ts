import { Router } from '@rocket.chat/http-router';
import Ajv from 'ajv';
import express from 'express';
import request from 'supertest';

import { rateLimiterMiddleware, type ResolvedRateLimiter } from './rateLimiter';
import { remoteAddressMiddleware } from './remoteAddressMiddleware';
import { CachedSettings } from '../../../settings/CachedSettings';

const ajv = new Ajv();

const makeRateLimiter = (numRequestsAllowed: number, intervalTimeInMS: number) => {
	const counters = new Map<string, number>();
	let lastReset = Date.now();

	const keyOf = (input: { route: string; IPAddr: string; userId?: string }) => `route${input.route}userId${input.userId ?? ''}`;

	return {
		increment(input: any) {
			if (Date.now() - lastReset > intervalTimeInMS) {
				counters.clear();
				lastReset = Date.now();
			}
			counters.set(keyOf(input), (counters.get(keyOf(input)) ?? 0) + 1);
		},
		async check(input: any) {
			const used = counters.get(keyOf(input)) ?? 0;
			return {
				allowed: used <= numRequestsAllowed,
				numInvocationsLeft: Math.max(0, numRequestsAllowed - used),
				timeToReset: intervalTimeInMS - (Date.now() - lastReset),
			};
		},
	};
};

const buildApp = ({
	numRequestsAllowed,
	settings,
	canBypass = async () => false,
}: {
	numRequestsAllowed?: number;
	settings: CachedSettings;
	canBypass?: (userId: string) => Promise<boolean>;
}) => {
	const resolved: ResolvedRateLimiter | undefined = numRequestsAllowed
		? {
				key: '/v1/testget',
				rateLimiter: makeRateLimiter(numRequestsAllowed, 60_000) as any,
				options: { numRequestsAllowed, intervalTimeInMS: 60_000 },
			}
		: undefined;

	const api = new Router('/api')
		.use(remoteAddressMiddleware)
		.use(async (c: any, next: any) => {
			const userId = c.req.header('x-user-id');
			c.set('user', userId ? { _id: userId } : null);
			return next();
		})
		.use(rateLimiterMiddleware({ settings, resolve: () => resolved, canBypass }))
		.get('/test', { response: { 200: ajv.compile({ type: 'object', properties: { success: { type: 'boolean' } } }) } }, async () => ({
			statusCode: 200 as const,
			body: { success: true },
		}));

	const app = express();
	app.use(api.router);
	return app;
};

const enabledSettings = () => {
	const settings = new CachedSettings();
	settings.set({ _id: 'API_Enable_Rate_Limiter', value: true } as any);
	settings.set({ _id: 'API_Enable_Rate_Limiter_Dev', value: true } as any);
	return settings;
};

describe('Rate limiter middleware', () => {
	it('should let requests through until the allowance is spent, then reject with 429', async () => {
		const app = buildApp({ numRequestsAllowed: 2, settings: enabledSettings() });

		const first = await request(app).get('/api/test').set('x-user-id', 'alice');
		const second = await request(app).get('/api/test').set('x-user-id', 'alice');
		const third = await request(app).get('/api/test').set('x-user-id', 'alice');

		expect([first.status, second.status, third.status]).toEqual([200, 200, 429]);
		expect(third.body).toEqual({
			success: false,
			error: expect.stringContaining('too many requests'),
		});
		expect(third.body.error).toContain('[error-too-many-requests]');
	});

	it('should keep a separate allowance per user', async () => {
		const app = buildApp({ numRequestsAllowed: 2, settings: enabledSettings() });

		await request(app).get('/api/test').set('x-user-id', 'alice');
		await request(app).get('/api/test').set('x-user-id', 'alice');
		const aliceBlocked = await request(app).get('/api/test').set('x-user-id', 'alice');
		const bob = await request(app).get('/api/test').set('x-user-id', 'bob');

		expect(aliceBlocked.status).toBe(429);
		expect(bob.status).toBe(200);
	});

	it('should report the allowance on the response headers', async () => {
		const app = buildApp({ numRequestsAllowed: 2, settings: enabledSettings() });

		const res = await request(app).get('/api/test').set('x-user-id', 'alice');

		expect(res.headers['x-ratelimit-limit']).toBe('2');
		expect(res.headers['x-ratelimit-remaining']).toBe('1');
		expect(Number(res.headers['x-ratelimit-reset'])).toBeGreaterThan(Date.now());
	});

	it('should keep the headers on the 429 response', async () => {
		const app = buildApp({ numRequestsAllowed: 1, settings: enabledSettings() });

		await request(app).get('/api/test').set('x-user-id', 'alice');
		const blocked = await request(app).get('/api/test').set('x-user-id', 'alice');

		expect(blocked.status).toBe(429);
		expect(blocked.headers['x-ratelimit-limit']).toBe('1');
		expect(blocked.headers['x-ratelimit-remaining']).toBe('0');
	});

	it('should not limit a user allowed to bypass', async () => {
		const app = buildApp({ numRequestsAllowed: 1, settings: enabledSettings(), canBypass: async (userId) => userId === 'admin' });

		const statuses = [];
		for (let i = 0; i < 5; i++) {
			statuses.push((await request(app).get('/api/test').set('x-user-id', 'admin')).status);
		}

		expect(statuses).toEqual([200, 200, 200, 200, 200]);
	});

	it('should not limit when the route has no rule registered', async () => {
		const app = buildApp({ settings: enabledSettings() });

		const res = await request(app).get('/api/test').set('x-user-id', 'alice');

		expect(res.status).toBe(200);
		expect(res.headers['x-ratelimit-limit']).toBeUndefined();
	});

	it('should not limit in development while the dev setting is off', async () => {
		const settings = new CachedSettings();
		settings.set({ _id: 'API_Enable_Rate_Limiter', value: true } as any);
		settings.set({ _id: 'API_Enable_Rate_Limiter_Dev', value: false } as any);
		const previous = process.env.NODE_ENV;
		process.env.NODE_ENV = 'development';

		try {
			const app = buildApp({ numRequestsAllowed: 1, settings });

			await request(app).get('/api/test').set('x-user-id', 'alice');
			const second = await request(app).get('/api/test').set('x-user-id', 'alice');

			expect(second.status).toBe(200);
		} finally {
			process.env.NODE_ENV = previous;
		}
	});

	it('should not limit while the rate limiter setting is off', async () => {
		const settings = new CachedSettings();
		settings.set({ _id: 'API_Enable_Rate_Limiter', value: false } as any);
		const app = buildApp({ numRequestsAllowed: 1, settings });

		await request(app).get('/api/test').set('x-user-id', 'alice');
		const second = await request(app).get('/api/test').set('x-user-id', 'alice');

		expect(second.status).toBe(200);
	});
});
