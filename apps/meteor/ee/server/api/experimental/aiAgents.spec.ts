import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import { LocalBroker, ServiceClass, api } from '@rocket.chat/core-services';
import type { IAuthorization } from '@rocket.chat/core-services';
import type { IAiEngine } from '@rocket.chat/core-typings';
import type { LicenseManager } from '@rocket.chat/license';
import { mockModel } from '@rocket.chat/models/testing';
import { Hono } from 'hono';

import './aiAgents';
import { API } from '../../../../server/api/api';
import { checkPermissions } from '../../../../server/api/api.helpers';
import type { TypedOptions } from '../../../../server/api/definition';
import { permissionsMiddleware } from '../../../../server/api/v1/middlewares/permissions';
import { settings } from '../../../../server/settings/cached';
import { authenticateEngineRequest } from '../../lib/ai-agents/engineCredentials';
import { license } from '../v1/middlewares/license';

jest.mock('../../../../server/meteor-methods/rooms/addUsersToRoom', () => ({
	assertCanAddUsersToRoom: jest.fn(),
	addUsersToRoomMethod: jest.fn(),
}));

jest.mock('../../../../server/api/api', () => ({
	API: {
		v1: {
			unauthorized: (msg: string) => ({ statusCode: 401, body: { success: false, error: msg } }),
			forbidden: (msg: string) => ({ statusCode: 403, body: { success: false, error: msg } }),
			internalError: () => ({ statusCode: 500, body: { success: false, error: 'Internal server error' } }),
		},
		experimental: {
			get: jest.fn(),
			post: jest.fn(),
			success: jest.fn((result: Record<string, unknown> = {}) => ({ statusCode: 200, body: { ...result, success: true } })),
			failure: jest.fn((error: string, errorType: string) => ({ statusCode: 400, body: { success: false, error, errorType } })),
			forbidden: jest.fn((error: string) => ({ statusCode: 403, body: { success: false, error } })),
			notFound: jest.fn((error: string) => ({ statusCode: 404, body: { success: false, error } })),
		},
	},
}));

let aiAgentsEnabledSetting = true;

jest.mock('../../../../server/settings/cached', () => ({
	settings: {
		get: jest.fn((id: string) => {
			if (id === 'AI_Agents_Engine_Credential_Days') {
				return 30;
			}
			if (id === 'AI_Agents_Enabled') {
				return aiAgentsEnabledSetting;
			}
			return undefined;
		}),
	},
}));

type RegisteredRoute = { method: 'GET' | 'POST'; name: string; options: TypedOptions };

const granted = new Set<string>();

class AuthorizationDouble extends ServiceClass implements Pick<IAuthorization, 'hasAllPermission' | 'hasAtLeastOnePermission'> {
	protected name = 'authorization';

	async hasAllPermission(_userId: string, permissions: string[]) {
		return permissions.every((permission) => granted.has(permission));
	}

	async hasAtLeastOnePermission(_userId: string, permissions: string[]) {
		return permissions.some((permission) => granted.has(permission));
	}
}

const authorization = new AuthorizationDouble();

const registered = (method: RegisteredRoute['method'], calls: unknown[][]): RegisteredRoute[] =>
	calls.map(([name, options]) => ({ method, name: name as string, options: options as TypedOptions }));

const routes: RegisteredRoute[] = [
	...registered('GET', jest.mocked(API.experimental.get).mock.calls),
	...registered('POST', jest.mocked(API.experimental.post).mock.calls),
];

const handled = jest.fn();

const send = (route: RegisteredRoute, { signedIn = true, licensed = true }: { signedIn?: boolean; licensed?: boolean } = {}) => {
	const licenseManager = { hasModule: (module: string) => licensed && module === AI_LICENSE_MODULE } as unknown as LicenseManager;
	const app = new Hono();
	app.use(async (c, next) => {
		c.set('user' as never, (signedIn ? { _id: 'admin-1' } : null) as never);
		await next();
	});
	const options = { ...route.options };
	checkPermissions(options);
	app.use(permissionsMiddleware(options));
	app.use(license(options, licenseManager));
	app.all('/', (c) => {
		handled();
		return c.text('handled');
	});

	return app.request('/', { method: route.method });
};

const requiredPermissions = (route: RegisteredRoute) => route.options.permissionsRequired as string[];

const privilegedAdminRoutes = new Set([
	'ai-agents.engines.link',
	'ai-agents.engines.rotateCredential',
	'ai-agents.engines.revokeCredential',
	'ai-agents.engines.reserveBots',
	'ai-agents.seats.register',
	'ai-agents.seats.retire',
]);

describe('AI agents routes (R06 permission & license matrix)', () => {
	beforeAll(() => {
		api.setBroker(new LocalBroker());
		api.registerService(authorization);
	});

	afterAll(async () => {
		await api.destroyService(authorization);
	});

	beforeEach(() => {
		granted.clear();
		handled.mockClear();
		aiAgentsEnabledSetting = true;
	});

	it('registers all 12 management routes', () => {
		expect(routes.map(({ method, name }) => `${method} ${name}`).sort()).toEqual([
			'GET ai-agents.engines',
			'GET ai-agents.info',
			'GET ai-agents.list',
			'POST ai-agents.create',
			'POST ai-agents.disable',
			'POST ai-agents.engines.link',
			'POST ai-agents.engines.reserveBots',
			'POST ai-agents.engines.revokeCredential',
			'POST ai-agents.engines.rotateCredential',
			'POST ai-agents.retry',
			'POST ai-agents.seats.register',
			'POST ai-agents.seats.retire',
		]);
	});

	it('requires a signed-in user, the AI add-on, and manage-ai-agents on every route', () => {
		for (const route of routes) {
			expect(route.options.authRequired).toBe(true);
			expect(route.options.license).toEqual([AI_LICENSE_MODULE]);
			expect(requiredPermissions(route)).toContain('manage-ai-agents');
		}
	});

	it('requires both manage-ai-agents and edit-privileged-setting on engine and seat admin routes', () => {
		const adminRoutes = routes.filter((route) => privilegedAdminRoutes.has(route.name));
		const nonAdminRoutes = routes.filter((route) => !privilegedAdminRoutes.has(route.name));

		for (const route of adminRoutes) {
			expect(requiredPermissions(route)).toEqual(expect.arrayContaining(['manage-ai-agents', 'edit-privileged-setting']));
		}
		for (const route of nonAdminRoutes) {
			expect(requiredPermissions(route)).toEqual(['manage-ai-agents']);
		}
	});

	it('sets 30/min rate limits on all management POST routes', () => {
		const writeRoutes = routes.filter((route) => route.method === 'POST');
		expect(writeRoutes.length).toBeGreaterThan(0);
		for (const route of writeRoutes) {
			expect(route.options.rateLimiterOptions).toEqual({ numRequestsAllowed: 30, intervalTimeInMS: 60_000 });
		}
	});

	describe.each(routes.map((route) => [`${route.method} ${route.name}`, route] as const))('%s', (_label, route) => {
		it('refuses an anonymous caller', async () => {
			const response = await send(route, { signedIn: false });

			expect(response.status).toBe(401);
			expect(handled).not.toHaveBeenCalled();
		});

		it('refuses a caller without the permission while the add-on is licensed', async () => {
			const response = await send(route);

			expect(response.status).toBe(403);
			expect(handled).not.toHaveBeenCalled();
		});

		it('refuses a caller holding only part of the required permissions', async () => {
			for (const missing of requiredPermissions(route)) {
				granted.clear();
				requiredPermissions(route)
					.filter((permission) => permission !== missing)
					.forEach((permission) => granted.add(permission));

				const response = await send(route);

				expect(response.status).toBe(403);
			}
			expect(handled).not.toHaveBeenCalled();
		});

		it('refuses an authorized caller without the AI add-on', async () => {
			requiredPermissions(route).forEach((permission) => granted.add(permission));

			const response = await send(route, { licensed: false });

			expect(response.status).toBe(400);
			await expect(response.json()).resolves.toMatchObject({ errorType: 'error-action-not-allowed' });
			expect(handled).not.toHaveBeenCalled();
		});

		it('lets an authorized caller through with the AI add-on', async () => {
			requiredPermissions(route).forEach((permission) => granted.add(permission));

			const response = await send(route);

			expect(response.status).toBe(200);
			expect(handled).toHaveBeenCalledTimes(1);
		});
	});
});

describe('AI engine credential & feature-flag routes', () => {
	const aiEngines = {
		insertOne: jest.fn(),
		findOneById: jest.fn(),
		findAllSortedByName: jest.fn(),
		findOneByCredentialId: jest.fn(),
		addCredentialWhileFewerActive: jest.fn(),
		revokeCredentialById: jest.fn(),
	};
	const serverEvents = {
		createAuditServerEvent: jest.fn(),
	};

	const call = async (name: string, params: Record<string, unknown> = {}) => {
		const route = routes.find((candidate) => candidate.name === name);
		const action = (route?.method === 'GET' ? jest.mocked(API.experimental.get) : jest.mocked(API.experimental.post)).mock.calls.find(
			([registeredName]) => registeredName === name,
		)?.[2] as unknown as (this: unknown) => Promise<{ statusCode: number; body: any; headers?: Record<string, string> }>;
		return action.call({
			userId: 'admin-1',
			user: { _id: 'admin-1', username: 'admin' },
			requestIp: '127.0.0.1',
			bodyParams: params,
			queryParams: params,
		});
	};

	beforeAll(() => {
		mockModel('AiEngines', aiEngines);
		mockModel('ServerEvents', serverEvents);
	});

	beforeEach(() => {
		Object.values(aiEngines).forEach((fn) => fn.mockReset());
		serverEvents.createAuditServerEvent.mockReset().mockResolvedValue(undefined);
		aiEngines.insertOne.mockResolvedValue({ insertedId: 'engine-1' });
		aiAgentsEnabledSetting = true;
		jest.mocked(settings.get).mockClear();
	});

	it('links an engine, storing only a verifier, showing the token once uncached, and recording an IDs-only audit event', async () => {
		const before = Date.now();

		const response = await call('ai-agents.engines.link', { name: 'QA engine' });

		expect(response.statusCode).toBe(200);
		expect(response.headers).toEqual({ 'Cache-Control': 'no-store' });
		const { token, id, expiresAt } = response.body.credential;
		const secret = token.split('.')[1];
		const [stored] = aiEngines.insertOne.mock.calls[0] as [IAiEngine];
		expect(JSON.stringify(stored)).not.toContain(secret);
		expect(stored).toMatchObject({ name: 'QA engine', createdBy: 'admin-1', credentials: [{ id }] });
		expect(response.body.engine.credentials).toEqual([{ id, createdAt: expect.any(Date), expiresAt }]);
		expect(expiresAt.getTime() - before).toBeGreaterThanOrEqual(30 * 24 * 60 * 60 * 1000 - 1000);

		expect(serverEvents.createAuditServerEvent).toHaveBeenCalledWith(
			'ai-agent.changed',
			{ action: 'engine.link', engineId: stored._id, credentialId: id },
			expect.objectContaining({ type: 'user', _id: 'admin-1' }),
		);
		expect(JSON.stringify(serverEvents.createAuditServerEvent.mock.calls[0])).not.toContain(secret);
		expect(JSON.stringify(serverEvents.createAuditServerEvent.mock.calls[0])).not.toContain('QA engine');

		aiEngines.findOneByCredentialId.mockResolvedValue(stored);
		await expect(authenticateEngineRequest(new Headers({ authorization: `Bearer ${token}` }))).resolves.toEqual({
			engineId: stored._id,
			credentialId: id,
		});
	});

	it('adds a second credential with a new token, uncached', async () => {
		aiEngines.addCredentialWhileFewerActive.mockResolvedValue({ modifiedCount: 1 });

		const response = await call('ai-agents.engines.rotateCredential', { engineId: 'engine-1' });

		expect(response.statusCode).toBe(200);
		expect(response.headers).toEqual({ 'Cache-Control': 'no-store' });
		const [engineId, credential, limit] = aiEngines.addCredentialWhileFewerActive.mock.calls[0];
		expect(engineId).toBe('engine-1');
		expect(limit).toMatchObject({ maxActive: 2 });
		expect(credential.id).toBe(response.body.credential.id);
		expect(JSON.stringify(credential)).not.toContain(response.body.credential.token.split('.')[1]);
	});

	it('refuses a rotation that would leave more than two active credentials', async () => {
		aiEngines.addCredentialWhileFewerActive.mockResolvedValue({ modifiedCount: 0 });

		const response = await call('ai-agents.engines.rotateCredential', { engineId: 'engine-1' });

		expect(response.statusCode).toBe(400);
		expect(response.body).not.toHaveProperty('credential');
	});

	it('revokes an active credential and refuses one that is unknown or already revoked', async () => {
		aiEngines.revokeCredentialById.mockResolvedValueOnce({ modifiedCount: 1 }).mockResolvedValueOnce({ modifiedCount: 0 });

		await expect(call('ai-agents.engines.revokeCredential', { engineId: 'engine-1', credentialId: 'cred-a' })).resolves.toMatchObject({
			statusCode: 200,
		});
		await expect(call('ai-agents.engines.revokeCredential', { engineId: 'engine-1', credentialId: 'cred-a' })).resolves.toMatchObject({
			statusCode: 400,
		});
	});

	it('lists engines without any credential verifier even while AI_Agents_Enabled is false', async () => {
		aiAgentsEnabledSetting = false;
		const now = new Date();
		aiEngines.findAllSortedByName.mockReturnValue({
			toArray: async () => [
				{
					_id: 'engine-1',
					name: 'QA engine',
					createdAt: now,
					credentials: [{ id: 'cred-a', verifier: 'ab'.repeat(32), createdAt: now, expiresAt: now }],
				},
			],
		});

		const response = await call('ai-agents.engines');

		expect(response.statusCode).toBe(200);
		expect(JSON.stringify(response.body)).not.toContain('verifier');
		expect(response.body.engines).toEqual([
			{ _id: 'engine-1', name: 'QA engine', createdAt: now, credentials: [{ id: 'cred-a', createdAt: now, expiresAt: now }] },
		]);
	});

	it('refuses list, info, create, retry, and disable when AI_Agents_Enabled is false', async () => {
		aiAgentsEnabledSetting = false;

		for (const name of ['ai-agents.list', 'ai-agents.info', 'ai-agents.create', 'ai-agents.retry', 'ai-agents.disable']) {
			const response = await call(name, { agentId: 'a1' });
			expect(response.statusCode).toBe(400);
			expect(response.body.errorType).toBe('error-ai-agents-disabled');
		}
	});
});
