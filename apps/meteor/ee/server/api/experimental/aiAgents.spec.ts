import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import { LocalBroker, ServiceClass, api } from '@rocket.chat/core-services';
import type { IAuthorization } from '@rocket.chat/core-services';
import type { IAiEngine, IAiEngineObservedSeat, IAiSeat, IRoom } from '@rocket.chat/core-typings';
import type { LicenseManager } from '@rocket.chat/license';
import { mockModel } from '@rocket.chat/models/testing';
import { Hono } from 'hono';

import './aiAgents';
import { API } from '../../../../server/api/api';
import { checkPermissions } from '../../../../server/api/api.helpers';
import type { TypedOptions } from '../../../../server/api/definition';
import { permissionsMiddleware } from '../../../../server/api/v1/middlewares/permissions';
import { addUsersToRoomMethod, assertCanAddUsersToRoom } from '../../../../server/meteor-methods/rooms/addUsersToRoom';
import { settings } from '../../../../server/settings/cached';
import { authenticateEngineRequest } from '../../lib/ai-agents/engineCredentials';
import { buildAgentRecord110 } from '../../lib/ai-agents/recordContract';
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
const accessibleRooms = new Set<string>();

class AuthorizationDouble
	extends ServiceClass
	implements Pick<IAuthorization, 'hasAllPermission' | 'hasAtLeastOnePermission' | 'canAccessRoom'>
{
	protected name = 'authorization';

	async canAccessRoom(room?: Partial<IRoom>) {
		return Boolean(room?._id && accessibleRooms.has(room._id));
	}

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

/**
 * Seat tools through the management API: each case calls the registered route action with the real lifecycle code over
 * model doubles, and checks the request against the route's body schema and the answer against its response schema.
 * Every case marked "parent:" behaves differently on 14614063b, where a built-in docs-only list decided seat tools.
 */
describe('seat tools come from the engine report (management API)', () => {
	const SKILLS_COMMIT = '438544159fd6359527759d2a97dd227ae9f6c58c';
	const ROUTE = 'openrouter/openai/gpt-4o-mini';
	const TOOL_NAMES: Record<string, string> = { docs_search: 'Docs search', docs_read: 'Docs page', weather_get: 'Weather' };

	const models = {
		AiEngines: { findOneById: jest.fn(), findAllSortedByName: jest.fn() },
		AiSeats: {
			findByEngineId: jest.fn(),
			findOneBySeatId: jest.fn(),
			findAllSortedBySeatId: jest.fn(),
			registerSeat: jest.fn(),
			claimSeat: jest.fn(),
		},
		AiAgents: {
			findOneById: jest.fn(),
			findOneBySeatId: jest.fn(),
			findAllSortedByCreatedAt: jest.fn(),
			insertOne: jest.fn(),
			deleteOneUncommittedById: jest.fn(),
			allocateVersionById: jest.fn(),
			setHeadVersionById: jest.fn(),
		},
		AiAgentRevisions: { insertOne: jest.fn(), findOneByAgentIdAndVersion: jest.fn() },
		Rooms: { findOneById: jest.fn() },
		Users: { findOneById: jest.fn(), activateReservedAgentBot: jest.fn() },
		Subscriptions: { findOneBannedSubscription: jest.fn(), findOneByRoomIdAndUserId: jest.fn() },
		ServerEvents: { createAuditServerEvent: jest.fn() },
	};

	const observedSeat = (seatId: string, overrides: Partial<IAiEngineObservedSeat> = {}): IAiEngineObservedSeat => ({
		seatId,
		botId: `bot-${seatId}`,
		state: 'provisioned',
		availability: 'unavailable',
		reason: 'seat-provisioned',
		allowedRooms: ['room-general'],
		acceptedVersion: 0,
		poisonFloor: 0,
		identity120Seen: false,
		admittedQuestionSeen: false,
		...overrides,
	});

	const freshAt = () => new Date(Date.now() - 5_000);

	/** A 1.2.0 report: the engine names each seat's tools. */
	const engine120 = (
		seatTools: { seatId: string; allowedTools: string[] }[],
		seats: IAiEngineObservedSeat[] = [],
		lastReportAt: Date = freshAt(),
	): IAiEngine => {
		const tools = [...new Set(seatTools.flatMap((entry) => entry.allowedTools))].sort();
		return {
			_id: 'eng-1',
			_updatedAt: lastReportAt,
			name: 'QA engine',
			credentials: [],
			createdBy: 'admin-1',
			createdAt: lastReportAt,
			lastReportAt,
			observed: {
				contractVersion: '1.2.0',
				workspaceId: 'ws-1',
				reportedAt: lastReportAt,
				catalogue: {
					tools,
					toolEntries: tools.map((id) => ({ id, name: TOOL_NAMES[id] ?? id, effect: 'read' as const })),
					skillsCommit: SKILLS_COMMIT,
					skills: ['public-docs'],
					modelRoutes: [ROUTE],
				},
				seats,
				seatTools,
			},
		};
	};

	const seatDoc = (seatId: string, overrides: Partial<IAiSeat> = {}): IAiSeat => ({
		_id: `doc-${seatId}`,
		_updatedAt: new Date(),
		engineId: 'eng-1',
		seatId,
		botUserId: `bot-${seatId}`,
		allowedRoomIds: ['room-general'],
		allowedToolIds: ['docs_search', 'docs_read', 'weather_get'],
		allowedRouteIds: [ROUTE],
		registeredBy: 'admin-1',
		registeredAt: new Date(),
		state: 'registered',
		...overrides,
	});

	const callRoute = async (name: string, params: Record<string, unknown> = {}) => {
		const route = routes.find((candidate) => candidate.name === name);
		const options = route?.options as unknown as {
			body?: (value: unknown) => boolean;
			response: Record<number, ((value: unknown) => boolean) | undefined>;
		};
		if (route?.method === 'POST') {
			expect(options.body?.(params)).toBe(true);
		}
		const action = (route?.method === 'GET' ? jest.mocked(API.experimental.get) : jest.mocked(API.experimental.post)).mock.calls.find(
			([registeredName]) => registeredName === name,
		)?.[2] as unknown as (this: unknown) => Promise<{ statusCode: number; body: any }>;
		const response = await action.call({
			userId: 'admin-1',
			user: { _id: 'admin-1', username: 'admin' },
			requestIp: '127.0.0.1',
			bodyParams: params,
			queryParams: params,
		});
		const validate = options.response[response.statusCode] as ((value: unknown) => boolean) & { errors?: unknown };
		const valid = validate?.(response.body);
		expect({ statusCode: response.statusCode, valid, errors: validate?.errors ?? null, body: response.body }).toMatchObject({
			valid: true,
		});
		return response;
	};

	const registerBody = (allowedToolIds: string[]) => ({
		engineId: 'eng-1',
		seatId: 'seat-1',
		botUserId: 'bot-seat-1',
		allowedRoomIds: ['room-general'],
		allowedToolIds,
		allowedRouteIds: [ROUTE],
	});
	const agentBody = (tools: string[]) => ({
		name: 'Docs Helper',
		instructions: 'Answer from public docs only.',
		rooms: ['room-general'],
		tools,
		modelRoute: ROUTE,
	});

	// The permission matrix above stops its authorization double when it finishes; this block needs its own.
	const roomAuthorization = new AuthorizationDouble();

	beforeAll(() => {
		api.registerService(roomAuthorization);
		for (const [name, double] of Object.entries(models)) {
			mockModel(name as 'AiEngines', double as never);
		}
	});

	afterAll(async () => {
		await api.destroyService(roomAuthorization);
	});

	beforeEach(() => {
		for (const double of Object.values(models)) {
			Object.values(double).forEach((fn) => fn.mockReset());
		}
		accessibleRooms.clear();
		accessibleRooms.add('room-general');
		aiAgentsEnabledSetting = true;
		jest.mocked(assertCanAddUsersToRoom).mockResolvedValue(undefined);
		jest.mocked(addUsersToRoomMethod).mockResolvedValue(true);
		models.Rooms.findOneById.mockImplementation(async (rid: string) => ({ _id: rid, name: rid.replace('room-', ''), t: 'c' }));
		models.Users.findOneById.mockImplementation(async (uid: string) => ({
			_id: uid,
			username: uid,
			type: 'bot',
			roles: ['bot'],
			active: false,
			aiAgents: { engineId: 'eng-1' },
		}));
		models.Users.activateReservedAgentBot.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
		models.Subscriptions.findOneBannedSubscription.mockResolvedValue(null);
		models.Subscriptions.findOneByRoomIdAndUserId.mockResolvedValue({ _id: 'sub-1' });
		models.ServerEvents.createAuditServerEvent.mockResolvedValue(undefined);
		models.AiSeats.registerSeat.mockResolvedValue({ insertedId: 'doc-seat-1' });
		models.AiSeats.claimSeat.mockResolvedValue({ modifiedCount: 1 });
		models.AiAgents.findOneBySeatId.mockResolvedValue(null);
		models.AiAgents.insertOne.mockResolvedValue({ insertedId: 'agent-1' });
		models.AiAgents.allocateVersionById.mockResolvedValue(1764028800001);
		models.AiAgents.setHeadVersionById.mockResolvedValue({ modifiedCount: 1 });
		models.AiAgentRevisions.insertOne.mockResolvedValue({ insertedId: 'rev-1' });
	});

	describe('ai-agents.seats.register', () => {
		// seat-1 is not in the report's `seats` (not registered here yet); its ceiling lives in `seatTools`.
		const SEAT_TOOLS = [
			{ seatId: 'seat-1', allowedTools: ['docs_search', 'weather_get'] },
			{ seatId: 'seat-2', allowedTools: ['docs_read'] },
		];

		it('registers a seat with a tool only the engine knows about (parent: weather_get refused)', async () => {
			models.AiEngines.findOneById.mockResolvedValue(engine120(SEAT_TOOLS));

			const response = await callRoute('ai-agents.seats.register', registerBody(['docs_search', 'weather_get']));

			expect(response.statusCode).toBe(200);
			expect(response.body.seat.allowedToolIds).toEqual(['docs_search', 'weather_get']);
		});

		it.each([
			['a tool the engine published only for another seat', () => engine120(SEAT_TOOLS), ['docs_read'], 'error-ai-tool-not-allowed'],
			[
				'a seat a later report no longer names',
				() => engine120([{ seatId: 'seat-2', allowedTools: ['docs_search'] }]),
				['docs_search'],
				'error-ai-tool-not-allowed',
			],
			['no report, even with no tools', () => ({ ...engine120(SEAT_TOOLS), observed: undefined }), [], 'error-ai-engine-report-stale'],
			[
				'a stale report, even with no tools',
				() => engine120(SEAT_TOOLS, [], new Date(Date.now() - 121_000)),
				[],
				'error-ai-engine-report-stale',
			],
			['no report, with tools', () => ({ ...engine120(SEAT_TOOLS), observed: undefined }), ['docs_search'], 'error-ai-engine-report-stale'],
		])('refuses %s and registers nothing (parent: registered)', async (_label, engine, tools, errorType) => {
			models.AiEngines.findOneById.mockResolvedValue(engine());

			const response = await callRoute('ai-agents.seats.register', registerBody(tools));

			expect(response).toMatchObject({ statusCode: 400, body: { errorType } });
			expect(models.AiSeats.registerSeat).not.toHaveBeenCalled();
		});

		it('takes catalogue.tools as every seat ceiling on a 1.1.0 report, not the old docs list (parent: both reversed)', async () => {
			const legacy = engine120([{ seatId: 'other-seat', allowedTools: ['docs_search', 'weather_get'] }]);
			legacy.observed = { ...(legacy.observed as NonNullable<IAiEngine['observed']>), contractVersion: '1.1.0', seatTools: undefined };
			delete legacy.observed.catalogue.toolEntries;
			models.AiEngines.findOneById.mockResolvedValue(legacy);

			await expect(callRoute('ai-agents.seats.register', registerBody(['weather_get']))).resolves.toMatchObject({ statusCode: 200 });
			await expect(callRoute('ai-agents.seats.register', registerBody(['docs_read']))).resolves.toMatchObject({
				statusCode: 400,
				body: { errorType: 'error-ai-tool-not-allowed' },
			});
			expect(models.AiSeats.registerSeat).toHaveBeenCalledTimes(1);
		});
	});

	describe('ai-agents.create', () => {
		const withSeat = (seatTools: { seatId: string; allowedTools: string[] }[]) => {
			models.AiEngines.findOneById.mockResolvedValue(engine120(seatTools, [observedSeat('seat-1')]));
			models.AiSeats.findByEngineId.mockReturnValue({ toArray: async () => [seatDoc('seat-1')] });
		};

		it('publishes an agent with a tool only the engine knows about (parent: weather_get refused)', async () => {
			withSeat([{ seatId: 'seat-1', allowedTools: ['docs_search', 'weather_get'] }]);

			const response = await callRoute('ai-agents.create', { engineId: 'eng-1', ...agentBody(['weather_get']) });

			expect(response.statusCode).toBe(200);
			expect(response.body.agent.tools).toEqual(['weather_get']);
		});

		it.each([
			[
				'a tool published only for another seat',
				[
					{ seatId: 'seat-1', allowedTools: ['docs_search', 'weather_get'] },
					{ seatId: 'seat-2', allowedTools: ['docs_read'] },
				],
				'error-ai-no-seat-offers-all-tools',
			],
			['a tool the engine never published', [{ seatId: 'seat-1', allowedTools: ['docs_search'] }], 'error-ai-tool-not-allowed'],
		])('refuses %s before claiming a seat (parent: docs_read published)', async (_label, seatTools, errorType) => {
			withSeat(seatTools);

			const response = await callRoute('ai-agents.create', { engineId: 'eng-1', ...agentBody(['docs_read']) });

			expect(response).toMatchObject({ statusCode: 400, body: { errorType } });
			expect(models.AiAgents.insertOne).not.toHaveBeenCalled();
			expect(models.AiSeats.claimSeat).not.toHaveBeenCalled();
		});
	});

	describe('ai-agents.retry', () => {
		const withClaimedSeat = (offered: string[]) => {
			models.AiAgents.findOneById.mockResolvedValue({
				_id: 'agent-1',
				engineId: 'eng-1',
				seatId: 'seat-1',
				claim: '11111111-2222-4333-8444-555555555555',
				lastVersion: 0,
				createdAt: new Date(),
			});
			models.AiSeats.findOneBySeatId.mockResolvedValue(seatDoc('seat-1', { state: 'claimed', agentId: 'agent-1', claimedAt: new Date() }));
			models.AiEngines.findOneById.mockResolvedValue(
				engine120([{ seatId: 'seat-1', allowedTools: offered }], [observedSeat('seat-1', { state: 'claimed' })]),
			);
		};

		it('publishes with a tool only the engine knows about (parent: weather_get refused)', async () => {
			withClaimedSeat(['weather_get']);

			const response = await callRoute('ai-agents.retry', { agentId: 'agent-1', ...agentBody(['weather_get']) });

			expect(response.statusCode).toBe(200);
			expect(response.body.agent.tools).toEqual(['weather_get']);
		});

		it('refuses a tool the engine withdrew from the claimed seat without activating the bot (parent: published)', async () => {
			withClaimedSeat(['docs_search']);

			const response = await callRoute('ai-agents.retry', { agentId: 'agent-1', ...agentBody(['docs_read']) });

			expect(response).toMatchObject({ statusCode: 400, body: { errorType: 'error-ai-tool-not-allowed' } });
			expect(models.Users.activateReservedAgentBot).not.toHaveBeenCalled();
		});
	});

	describe('ai-agents.list tool options', () => {
		it('offers only tools of seats this person can claim, by engine name, and marks an agent tool the engine withdrew', async () => {
			const published = buildAgentRecord110({
				id: 'seat-3',
				version: 100,
				updatedAt: new Date().toISOString(),
				name: 'Docs Helper',
				instructions: 'Answer from public docs only.',
				model: { provider: 'openrouter', id: 'openai/gpt-4o-mini' },
				tools: ['docs_search', 'weather_get'],
				skills: { commit: SKILLS_COMMIT, ids: [] },
				status: 'published',
				chat: { claim: '11111111-2222-4333-8444-555555555555', rooms: ['room-general'] },
			});
			models.AiEngines.findAllSortedByName.mockReturnValue({
				toArray: async () => [
					engine120(
						[
							{ seatId: 'seat-1', allowedTools: ['docs_search', 'weather_get'] },
							{ seatId: 'seat-2', allowedTools: ['docs_read'] },
							{ seatId: 'seat-3', allowedTools: ['docs_search'] },
						],
						[
							observedSeat('seat-1'),
							observedSeat('seat-2', { allowedRooms: ['room-hidden'] }),
							observedSeat('seat-3', { state: 'claimed', acceptedVersion: 100 }),
						],
					),
				],
			});
			models.AiSeats.findAllSortedBySeatId.mockReturnValue({
				toArray: async () => [
					seatDoc('seat-1'),
					// A channel this person cannot use: its tools are not offered.
					seatDoc('seat-2', { allowedRoomIds: ['room-hidden'] }),
					seatDoc('seat-3', { state: 'claimed', agentId: 'agent-3' }),
				],
			});
			models.AiAgents.findAllSortedByCreatedAt.mockReturnValue({
				toArray: async () => [
					{
						_id: 'agent-3',
						engineId: 'eng-1',
						seatId: 'seat-3',
						claim: '11111111-2222-4333-8444-555555555555',
						lastVersion: 100,
						headVersion: 100,
						status: 'published',
						createdAt: new Date(),
					},
				],
			});
			models.AiAgentRevisions.findOneByAgentIdAndVersion.mockResolvedValue({ bytes: published.binary, digest: published.digest });
			models.Users.findOneById.mockImplementation(async (uid: string) => ({
				_id: uid,
				username: uid,
				type: 'bot',
				roles: ['bot'],
				active: true,
				aiAgents: { engineId: 'eng-1', activatedAt: new Date() },
			}));

			const response = await callRoute('ai-agents.list');

			expect(response.statusCode).toBe(200);
			expect(response.body.engines[0].toolOptions).toEqual([
				{ id: 'docs_search', name: 'Docs search' },
				{ id: 'weather_get', name: 'Weather' },
			]);
			expect(response.body.agents[0].toolOptions).toEqual([
				{ id: 'docs_search', name: 'Docs search' },
				{ id: 'weather_get', name: 'Weather', withdrawn: true },
			]);
		});
	});
});
