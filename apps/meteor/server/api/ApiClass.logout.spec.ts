import { hashLoginToken } from '@rocket.chat/account-utils';
import { createNodeServer, createRootApp, mountRouter } from '@rocket.chat/http-router';
import { Sessions, Users } from '@rocket.chat/models';
import request from 'supertest';

import { APIClass } from './ApiClass';

jest.mock('meteor/meteor', () => ({ Meteor: {} }), { virtual: true });
jest.mock('../lib/http/httpServer', () => ({ httpApp: jest.requireActual('@rocket.chat/http-router').createRootApp() }));
jest.mock('meteor/rate-limit', () => ({ RateLimiter: jest.fn() }), { virtual: true });
jest.mock('meteor/accounts-base', () => ({ Accounts: { _accountData: {} as Record<string, unknown> } }), { virtual: true });
jest.mock('meteor/ddp', () => ({ DDP: {} }), { virtual: true });
jest.mock('meteor/ddp-common', () => ({ DDPCommon: {} }), { virtual: true });
jest.mock('meteor/facts-base', () => ({ Facts: { incrementServerFact: () => undefined } }), { virtual: true });
jest.mock('../../rocketchat.info', () => ({ Info: { version: '0.0.0' } }));
jest.mock('../settings', () => ({
	settings: {
		get: jest.fn(() => false),
		watch: jest.fn(),
		watchMultiple: jest.fn(),
		watchByRegex: jest.fn(),
		getByRegexp: jest.fn(() => []),
	},
}));
jest.mock('@rocket.chat/models', () => ({
	Users: {
		findOne: jest.fn(),
		findOneById: jest.fn(),
		updateOne: jest.fn(),
	},
	Sessions: {
		logoutBySessionIdAndUserId: jest.fn(),
	},
}));
jest.mock('./lib/getUserInfo', () => ({
	getUserInfo: jest.fn(),
}));
jest.mock('./lib/parseJsonQuery', () => ({
	parseJsonQuery: jest.fn(),
}));
jest.mock('../lib/notifyListener', () => ({
	notifyOnUserChangeAsync: jest.fn(),
}));
jest.mock('../lib/2fa/code', () => ({
	checkCodeForUser: jest.fn(),
}));
jest.mock('./v1/middlewares/permissions', () => ({
	permissionsMiddleware: () => async (_c: unknown, next: () => Promise<void>) => next(),
}));
jest.mock('../../ee/server/api/v1/middlewares/license', () => ({
	license: () => async (_c: unknown, next: () => Promise<void>) => next(),
}));
jest.mock('../../ee/server/api/v1/middlewares/licenseRequired', () => ({
	licenseRequired: () => async (_c: unknown, next: () => Promise<void>) => next(),
}));

describe('APIClass /v1/logout', () => {
	const rawToken = 'plain-auth-token';
	const userId = 'user-123';

	const app = createRootApp();
	let server: ReturnType<typeof createNodeServer>;

	beforeAll(() => {
		const api = new APIClass({
			apiPath: 'api',
			version: 'v1',
			useDefaultAuth: true,
			prettyJson: false,
		});
		mountRouter(app, api.router);
		server = createNodeServer(app).listen(0);
	});

	afterAll(() => {
		server?.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(Users.findOne).mockResolvedValue({ _id: userId, username: 'test-user' } as never);
		jest.mocked(Users.updateOne).mockResolvedValue({ acknowledged: true } as never);
		jest.mocked(Sessions.logoutBySessionIdAndUserId).mockResolvedValue(undefined);
	});

	it('returns a 200 JSON confirmation body on POST /api/v1/logout and invalidates token & session', async () => {
		const postRes = await request(server).post('/api/v1/logout').set('x-user-id', userId).set('x-auth-token', rawToken);

		expect(postRes.status).toBe(200);
		expect(postRes.headers['content-type']).toContain('application/json');
		expect(postRes.body).toEqual({
			status: 'success',
			data: {
				message: "You've been logged out!",
			},
			success: true,
		});
		expect(Users.updateOne).toHaveBeenCalledWith(
			{ _id: userId },
			{ $pull: { 'services.resume.loginTokens': { hashedToken: hashLoginToken(rawToken) } } },
		);
		expect(Sessions.logoutBySessionIdAndUserId).toHaveBeenCalledWith({
			loginToken: hashLoginToken(rawToken),
			userId,
		});
	});

	it('returns a 200 JSON confirmation body on GET /api/v1/logout and invalidates token & session', async () => {
		const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
		try {
			const getRes = await request(server).get('/api/v1/logout').set('x-user-id', userId).set('x-auth-token', rawToken);

			expect(getRes.status).toBe(200);
			expect(getRes.headers['content-type']).toContain('application/json');
			expect(getRes.body).toEqual({
				status: 'success',
				data: {
					message: "You've been logged out!",
				},
				success: true,
			});
			expect(Users.updateOne).toHaveBeenCalledWith(
				{ _id: userId },
				{ $pull: { 'services.resume.loginTokens': { hashedToken: hashLoginToken(rawToken) } } },
			);
			expect(Sessions.logoutBySessionIdAndUserId).toHaveBeenCalledWith({
				loginToken: hashLoginToken(rawToken),
				userId,
			});
		} finally {
			warnSpy.mockRestore();
		}
	});

	it('returns 401 JSON when /api/v1/logout is called without valid credentials', async () => {
		const res = await request(server).post('/api/v1/logout');

		expect(res.status).toBe(401);
		expect(res.headers['content-type']).toContain('application/json');
		expect(res.body).toMatchObject({
			success: false,
			status: 'error',
		});
	});
});
