import { LocalBroker, ServiceClass, api } from '@rocket.chat/core-services';
import type { IAuthorization } from '@rocket.chat/core-services';
import type { IAiEngine, IAiSeat, IRoom, IUser } from '@rocket.chat/core-typings';
import { mockModel } from '@rocket.chat/models/testing';

import {
	AiAgentActionError,
	createAiAgent,
	disableAiAgent,
	getAiAgentInfo,
	listAiAgentsForActor,
	registerSeatForEngine,
	retireSeatById,
	retryAiAgent,
} from './agentLifecycle';
import { buildAgentRecord110 } from './recordContract';
import { deriveAgentReadiness, isOrdinaryPublicChannel } from './seatValidation';
import { addUsersToRoomMethod, assertCanAddUsersToRoom } from '../../../../server/meteor-methods/rooms/addUsersToRoom';

jest.mock('../../../../server/meteor-methods/rooms/addUsersToRoom', () => ({
	assertCanAddUsersToRoom: jest.fn(),
	addUsersToRoomMethod: jest.fn(),
}));

const accessibleRooms = new Set<string>(['room-general']);

class AuthDouble extends ServiceClass implements Pick<IAuthorization, 'canAccessRoom'> {
	protected name = 'authorization';

	async canAccessRoom(room?: Partial<IRoom>) {
		return Boolean(room?._id && accessibleRooms.has(room._id));
	}
}

const authService = new AuthDouble();
const SKILLS_COMMIT = '438544159fd6359527759d2a97dd227ae9f6c58c';
const NOW = new Date('2026-11-25T00:00:00.000Z');
const ACTOR_USER = { _id: 'admin-1', username: 'admin' } as IUser;
const AUDIT_ACTOR = { type: 'user' as const, _id: 'admin-1', username: 'admin', ip: '127.0.0.1', useragent: 'jest' };

const makeFreshEngine = (seatOverrides: Partial<NonNullable<IAiEngine['observed']>['seats'][number]>[] = []): IAiEngine => ({
	_id: 'eng-1',
	_updatedAt: NOW,
	name: 'QA engine',
	credentials: [],
	createdBy: 'admin-1',
	createdAt: NOW,
	lastReportAt: new Date(NOW.getTime() - 10_000),
	observed: {
		contractVersion: '1.1.0',
		workspaceId: 'ws-1',
		reportedAt: new Date(NOW.getTime() - 10_000),
		catalogue: {
			tools: ['docs_search', 'docs_read'],
			skillsCommit: SKILLS_COMMIT,
			skills: ['public-docs'],
			modelRoutes: ['openrouter/openai/gpt-4o-mini'],
		},
		seats:
			seatOverrides.length > 0
				? seatOverrides.map((s) => ({
						seatId: 'seat-1',
						botId: 'bot-1',
						state: 'provisioned',
						availability: 'unavailable',
						reason: 'seat-provisioned',
						allowedRooms: ['room-general'],
						acceptedVersion: 0,
						poisonFloor: 0,
						identity120Seen: false,
						admittedQuestionSeen: false,
						...s,
					}))
				: [
						{
							seatId: 'seat-1',
							botId: 'bot-1',
							state: 'provisioned',
							availability: 'unavailable',
							reason: 'seat-provisioned',
							allowedRooms: ['room-general'],
							acceptedVersion: 0,
							poisonFloor: 0,
							identity120Seen: false,
							admittedQuestionSeen: false,
						},
					],
	},
});

const makeSeat = (overrides: Partial<IAiSeat> = {}): IAiSeat => ({
	_id: 'seat-doc-1',
	_updatedAt: NOW,
	engineId: 'eng-1',
	seatId: 'seat-1',
	botUserId: 'bot-1',
	allowedRoomIds: ['room-general'],
	allowedToolIds: ['docs_search', 'docs_read'],
	allowedRouteIds: ['openrouter/openai/gpt-4o-mini'],
	registeredBy: 'admin-1',
	registeredAt: NOW,
	state: 'registered',
	...overrides,
});

describe('R05 ordinary public channel eligibility rule', () => {
	it('accepts an ordinary public channel without requiring explicit false flags', () => {
		expect(isOrdinaryPublicChannel({ _id: 'r1', t: 'c' })).toBe(true);
		expect(isOrdinaryPublicChannel({ _id: 'r1', t: 'c', ro: false, encrypted: false })).toBe(true);
	});

	it.each([
		['private group', { _id: 'r1', t: 'p' as const }],
		['direct message', { _id: 'r1', t: 'd' as const }],
		['read-only', { _id: 'r1', t: 'c' as const, ro: true }],
		['federated', { _id: 'r1', t: 'c' as const, federated: true }],
		['broadcast', { _id: 'r1', t: 'c' as const, broadcast: true }],
		['encrypted', { _id: 'r1', t: 'c' as const, encrypted: true }],
		['archived', { _id: 'r1', t: 'c' as const, archived: true }],
		['team main', { _id: 'r1', t: 'c' as const, teamMain: true }],
		['discussion', { _id: 'r1', t: 'c' as const, prid: 'parent-1' }],
		['abac room', { _id: 'r1', t: 'c' as const, abacAttributes: [{ key: 'dept', values: ['eng'] }] }],
		['xmppFederation false', { _id: 'r1', t: 'c' as const, xmppFederation: false }],
		['xmppFederation null', { _id: 'r1', t: 'c' as const, xmppFederation: null }],
		['xmppFederation undefined key', { _id: 'r1', t: 'c' as const, xmppFederation: undefined }],
	])('refuses %s', (_label, room) => {
		expect(isOrdinaryPublicChannel(room as any)).toBe(false);
	});
});

describe('Step 3 RC-A agent lifecycle (R01, R03, R04, R09, R10, R10b, R12)', () => {
	const aiEngines = {
		findOneById: jest.fn(),
		findAllSortedByName: jest.fn(),
	};
	const aiSeats = {
		findOneBySeatId: jest.fn(),
		findByEngineId: jest.fn(),
		findAllSortedBySeatId: jest.fn(),
		registerSeat: jest.fn(),
		claimSeat: jest.fn(),
		retireSeat: jest.fn(),
	};
	const aiAgents = {
		findOneById: jest.fn(),
		findOneBySeatId: jest.fn(),
		findAllSortedByCreatedAt: jest.fn(),
		insertOne: jest.fn(),
		deleteOneUncommittedById: jest.fn(),
		allocateVersionById: jest.fn(),
		setHeadVersionById: jest.fn(),
	};
	const aiAgentRevisions = {
		insertOne: jest.fn(),
		findOneByAgentIdAndVersion: jest.fn(),
	};
	const rooms = {
		findOneById: jest.fn(),
	};
	const users = {
		findOneById: jest.fn(),
		activateReservedAgentBot: jest.fn(),
	};
	const subscriptions = {
		findOneBannedSubscription: jest.fn(),
		findOneByRoomIdAndUserId: jest.fn(),
	};
	const serverEvents = {
		createAuditServerEvent: jest.fn(),
	};

	beforeAll(() => {
		api.setBroker(new LocalBroker());
		api.registerService(authService);
		mockModel('AiEngines', aiEngines);
		mockModel('AiSeats', aiSeats);
		mockModel('AiAgents', aiAgents);
		mockModel('AiAgentRevisions', aiAgentRevisions);
		mockModel('Rooms', rooms);
		mockModel('Users', users);
		mockModel('Subscriptions', subscriptions);
		mockModel('ServerEvents', serverEvents);
	});

	afterAll(async () => {
		await api.destroyService(authService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		accessibleRooms.clear();
		accessibleRooms.add('room-general');

		jest.mocked(assertCanAddUsersToRoom).mockResolvedValue(undefined);
		jest.mocked(addUsersToRoomMethod).mockResolvedValue(true);

		rooms.findOneById.mockImplementation(async (rid: string) =>
			rid === 'room-general' ? { _id: 'room-general', name: 'general', t: 'c' } : null,
		);
		users.findOneById.mockResolvedValue({
			_id: 'bot-1',
			username: 'ai-agent-1',
			type: 'bot',
			roles: ['bot'],
			active: false,
			aiAgents: { engineId: 'eng-1' },
		});
		users.activateReservedAgentBot.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
		subscriptions.findOneBannedSubscription.mockResolvedValue(null);
		subscriptions.findOneByRoomIdAndUserId.mockResolvedValueOnce(null).mockResolvedValue({ _id: 'sub-1' });
		serverEvents.createAuditServerEvent.mockResolvedValue(undefined);
	});

	it('creates an agent through the 6-step flow, joins via addUsersToRoomMethod, writes 1.1.0 revision & IDs-only audit (R01, R09)', async () => {
		aiEngines.findOneById.mockResolvedValue(makeFreshEngine());
		aiSeats.findByEngineId.mockReturnValue({ toArray: async () => [makeSeat()] });
		aiAgents.findOneBySeatId.mockResolvedValue(null);
		aiAgents.insertOne.mockResolvedValue({ insertedId: 'agent-1' });
		aiSeats.claimSeat.mockResolvedValue({ modifiedCount: 1 });
		aiAgents.allocateVersionById.mockResolvedValue(1764028800001);
		aiAgentRevisions.insertOne.mockResolvedValue({ insertedId: 'rev-1' });
		aiAgents.setHeadVersionById.mockResolvedValue({ modifiedCount: 1 });

		const res = await createAiAgent(
			{
				engineId: 'eng-1',
				name: 'Docs Helper',
				instructions: 'Answer from public docs only.',
				rooms: ['room-general'],
				tools: ['docs_search'],
				modelRoute: 'openrouter/openai/gpt-4o-mini',
				skills: ['public-docs'],
			},
			{ user: ACTOR_USER, auditActor: AUDIT_ACTOR },
			NOW,
		);

		expect(res.version).toBe(1764028800001);
		expect(res.agent.readiness).toBe('published, waiting for engine');
		expect(users.activateReservedAgentBot).toHaveBeenCalledWith('bot-1', 'eng-1', 'Docs Helper');
		expect(addUsersToRoomMethod).toHaveBeenCalledWith('admin-1', { rid: 'room-general', users: ['ai-agent-1'] }, ACTOR_USER);
		expect(aiAgents.allocateVersionById).toHaveBeenCalledWith(expect.any(String), 86_400_000);
		expect(aiAgentRevisions.insertOne).toHaveBeenCalledWith(
			expect.objectContaining({ version: 1764028800001, status: 'published', action: 'create' }),
		);

		// Audit event carries IDs only — never name or instructions.
		expect(serverEvents.createAuditServerEvent).toHaveBeenCalledTimes(1);
		const auditJson = JSON.stringify(serverEvents.createAuditServerEvent.mock.calls[0]);
		expect(auditJson).not.toContain('Docs Helper');
		expect(auditJson).not.toContain('Answer from public docs only.');
	});

	it('rolls back an uncommitted agent and retries once on the next seat when claimSeat CAS loses (R03)', async () => {
		const seat1 = makeSeat({ seatId: 'seat-1', botUserId: 'bot-1' });
		const seat2 = makeSeat({ _id: 'seat-doc-2', seatId: 'seat-2', botUserId: 'bot-2' });
		aiEngines.findOneById.mockResolvedValue(
			makeFreshEngine([
				{ seatId: 'seat-1', botId: 'bot-1' },
				{ seatId: 'seat-2', botId: 'bot-2' },
			]),
		);
		aiSeats.findByEngineId.mockReturnValue({ toArray: async () => [seat1, seat2] });
		aiAgents.findOneBySeatId.mockResolvedValue(null);
		aiAgents.insertOne.mockResolvedValue({ insertedId: 'agent-x' });
		aiSeats.claimSeat.mockResolvedValueOnce({ modifiedCount: 0 }).mockResolvedValueOnce({ modifiedCount: 1 });
		aiAgents.deleteOneUncommittedById.mockResolvedValue({ deletedCount: 1 });
		users.findOneById.mockResolvedValue({
			_id: 'bot-2',
			username: 'ai-agent-2',
			type: 'bot',
			roles: ['bot'],
			active: false,
			aiAgents: { engineId: 'eng-1' },
		});
		aiAgents.allocateVersionById.mockResolvedValue(1764028800002);
		aiAgentRevisions.insertOne.mockResolvedValue({ insertedId: 'rev-2' });
		aiAgents.setHeadVersionById.mockResolvedValue({ modifiedCount: 1 });

		const res = await createAiAgent(
			{
				engineId: 'eng-1',
				name: 'Docs Helper',
				instructions: 'Answer from public docs.',
				rooms: ['room-general'],
				tools: ['docs_search'],
				modelRoute: 'openrouter/openai/gpt-4o-mini',
			},
			{ user: ACTOR_USER, auditActor: AUDIT_ACTOR },
			NOW,
		);

		expect(aiAgents.deleteOneUncommittedById).toHaveBeenCalledTimes(1);
		expect(res.agent.seatId).toBe('seat-2');
	});

	it('refuses activation when activateReservedAgentBot matches 0 docs (tampered bot) and leaves no revision (R12)', async () => {
		aiEngines.findOneById.mockResolvedValue(makeFreshEngine());
		aiSeats.findByEngineId.mockReturnValue({ toArray: async () => [makeSeat()] });
		aiAgents.findOneBySeatId.mockResolvedValue(null);
		aiAgents.insertOne.mockResolvedValue({ insertedId: 'agent-1' });
		aiSeats.claimSeat.mockResolvedValue({ modifiedCount: 1 });
		users.activateReservedAgentBot.mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });

		await expect(
			createAiAgent(
				{
					engineId: 'eng-1',
					name: 'Docs Helper',
					instructions: 'Answer from public docs.',
					rooms: ['room-general'],
					tools: ['docs_search'],
					modelRoute: 'openrouter/openai/gpt-4o-mini',
				},
				{ user: ACTOR_USER, auditActor: AUDIT_ACTOR },
				NOW,
			),
		).rejects.toMatchObject({ errorType: 'error-ai-bot-invalid' });

		expect(aiAgentRevisions.insertOne).not.toHaveBeenCalled();
		expect(aiAgents.setHeadVersionById).not.toHaveBeenCalled();
	});

	it('never puts a retired seat back on Create pick list even when engine report claims provisioned, and Retry refuses retired seats (R10, R10b)', async () => {
		const retiredSeat = makeSeat({ state: 'retired', retiredBy: 'admin-1', retiredAt: NOW });
		// Engine report falsely claims the retired seat is provisioned & available.
		aiEngines.findOneById.mockResolvedValue(makeFreshEngine([{ seatId: 'seat-1', state: 'provisioned', availability: 'available' }]));
		aiSeats.findByEngineId.mockReturnValue({ toArray: async () => [retiredSeat] });

		await expect(
			createAiAgent(
				{
					engineId: 'eng-1',
					name: 'Docs Helper',
					instructions: 'Answer from docs.',
					rooms: ['room-general'],
					tools: ['docs_search'],
					modelRoute: 'openrouter/openai/gpt-4o-mini',
				},
				{ user: ACTOR_USER, auditActor: AUDIT_ACTOR },
				NOW,
			),
		).rejects.toMatchObject({ errorType: 'error-ai-no-seat-available' });

		// Retry on an incomplete agent whose seat was retired MUST refuse.
		aiAgents.findOneById.mockResolvedValue({
			_id: 'agent-1',
			engineId: 'eng-1',
			seatId: 'seat-1',
			claim: '11111111-2222-4333-8444-555555555555',
			lastVersion: 0,
			createdAt: NOW,
		});
		aiSeats.findOneBySeatId.mockResolvedValue(retiredSeat);

		await expect(
			retryAiAgent(
				{
					agentId: 'agent-1',
					name: 'Docs Helper',
					instructions: 'Answer from docs.',
					rooms: ['room-general'],
					tools: ['docs_search'],
					modelRoute: 'openrouter/openai/gpt-4o-mini',
				},
				{ user: ACTOR_USER, auditActor: AUDIT_ACTOR },
				NOW,
			),
		).rejects.toMatchObject({ errorType: 'error-ai-seat-not-claimed' });
	});

	it('blocks Create when engine report is stale (> 120s) or disagrees with registered seat (R10)', async () => {
		const staleEngine = makeFreshEngine();
		staleEngine.lastReportAt = new Date(NOW.getTime() - 121_000);
		aiEngines.findOneById.mockResolvedValue(staleEngine);

		await expect(
			createAiAgent(
				{
					engineId: 'eng-1',
					name: 'Docs Helper',
					instructions: 'Answer from docs.',
					rooms: ['room-general'],
					tools: ['docs_search'],
					modelRoute: 'openrouter/openai/gpt-4o-mini',
				},
				{ user: ACTOR_USER, auditActor: AUDIT_ACTOR },
				NOW,
			),
		).rejects.toMatchObject({ errorType: 'error-ai-engine-report-stale' });

		// Fresh report whose seat disagrees (engine thinks seat is claimed) skips it.
		aiEngines.findOneById.mockResolvedValue(makeFreshEngine([{ seatId: 'seat-1', state: 'claimed' }]));
		aiSeats.findByEngineId.mockReturnValue({ toArray: async () => [makeSeat()] });

		await expect(
			createAiAgent(
				{
					engineId: 'eng-1',
					name: 'Docs Helper',
					instructions: 'Answer from docs.',
					rooms: ['room-general'],
					tools: ['docs_search'],
					modelRoute: 'openrouter/openai/gpt-4o-mini',
				},
				{ user: ACTOR_USER, auditActor: AUDIT_ACTOR },
				NOW,
			),
		).rejects.toMatchObject({ errorType: 'error-ai-no-seat-available' });
	});

	it('resumes an incomplete agent on its exact claimed seat on Retry and disables a published agent on Disable', async () => {
		const claimedSeat = makeSeat({ state: 'claimed', agentId: 'agent-1', claimedAt: NOW });
		aiAgents.findOneById.mockResolvedValue({
			_id: 'agent-1',
			engineId: 'eng-1',
			seatId: 'seat-1',
			claim: '11111111-2222-4333-8444-555555555555',
			lastVersion: 0,
			createdAt: NOW,
		});
		aiSeats.findOneBySeatId.mockResolvedValue(claimedSeat);
		aiEngines.findOneById.mockResolvedValue(makeFreshEngine([{ seatId: 'seat-1', state: 'provisioned' }]));
		aiAgents.allocateVersionById.mockResolvedValue(1764028800010);
		aiAgentRevisions.insertOne.mockResolvedValue({ insertedId: 'rev-10' });
		aiAgents.setHeadVersionById.mockResolvedValue({ modifiedCount: 1 });

		const retryRes = await retryAiAgent(
			{
				agentId: 'agent-1',
				name: 'Docs Helper',
				instructions: 'Answer from docs.',
				rooms: ['room-general'],
				tools: ['docs_search'],
				modelRoute: 'openrouter/openai/gpt-4o-mini',
			},
			{ user: ACTOR_USER, auditActor: AUDIT_ACTOR },
			NOW,
		);
		expect(retryRes.agent._id).toBe('agent-1');
		expect(retryRes.agent.seatId).toBe('seat-1');
		expect(aiSeats.claimSeat).not.toHaveBeenCalled();

		// Disable writes a new disabled 1.1.0 revision keeping prior fields.
		const publishedBuilt = buildAgentRecord110({
			id: 'seat-1',
			version: 1764028800010,
			updatedAt: NOW.toISOString(),
			name: 'Docs Helper',
			instructions: 'Answer from docs.',
			model: { provider: 'openrouter', id: 'openai/gpt-4o-mini' },
			tools: ['docs_search'],
			skills: { commit: SKILLS_COMMIT, ids: [] },
			status: 'published',
			chat: { claim: '11111111-2222-4333-8444-555555555555', rooms: ['room-general'] },
		});
		aiAgents.findOneById.mockResolvedValue({
			_id: 'agent-1',
			engineId: 'eng-1',
			seatId: 'seat-1',
			claim: '11111111-2222-4333-8444-555555555555',
			lastVersion: 1764028800010,
			headVersion: 1764028800010,
			status: 'published',
			createdAt: NOW,
		});
		aiAgentRevisions.findOneByAgentIdAndVersion.mockResolvedValue({
			agentId: 'agent-1',
			version: 1764028800010,
			bytes: publishedBuilt.binary,
			digest: publishedBuilt.digest,
		});
		aiAgents.allocateVersionById.mockResolvedValue(1764028800011);

		const disableRes = await disableAiAgent('agent-1', { userId: 'admin-1', auditActor: AUDIT_ACTOR }, NOW);
		expect(disableRes.version).toBe(1764028800011);
		expect(disableRes.agent.status).toBe('disabled');
		expect(disableRes.agent.readiness).toBe('disabled');
		expect(disableRes.agent.engineConfirmed).toBe(false);
		expect(aiAgents.setHeadVersionById).toHaveBeenCalledWith('agent-1', 1764028800010, {
			version: 1764028800011,
			status: 'disabled',
		});
	});

	it.each([
		['different botId', { seatId: 'seat-1', state: 'claimed' as const, botId: 'bot-other' }],
		['different allowedRooms', { seatId: 'seat-1', state: 'claimed' as const, allowedRooms: ['room-other'] }],
		['retired state', { seatId: 'seat-1', state: 'retired' as const }],
		['fence-closed reason', { seatId: 'seat-1', state: 'claimed' as const, reason: 'fence-closed' }],
		['seat-poisoned reason', { seatId: 'seat-1', state: 'claimed' as const, reason: 'seat-poisoned' }],
		['seat-no-model-route reason', { seatId: 'seat-1', state: 'claimed' as const, reason: 'seat-no-model-route' }],
	])('refuses Retry when the engine report conflicts (%s) without activating bot or joining rooms', async (_label, observedSeat) => {
		const claimedSeat = makeSeat({ state: 'claimed', agentId: 'agent-1', claimedAt: NOW });
		aiAgents.findOneById.mockResolvedValue({
			_id: 'agent-1',
			engineId: 'eng-1',
			seatId: 'seat-1',
			claim: '11111111-2222-4333-8444-555555555555',
			lastVersion: 0,
			createdAt: NOW,
		});
		aiSeats.findOneBySeatId.mockResolvedValue(claimedSeat);
		aiEngines.findOneById.mockResolvedValue(makeFreshEngine([observedSeat]));

		await expect(
			retryAiAgent(
				{
					agentId: 'agent-1',
					name: 'Docs Helper',
					instructions: 'Answer from docs.',
					rooms: ['room-general'],
					tools: ['docs_search'],
					modelRoute: 'openrouter/openai/gpt-4o-mini',
				},
				{ user: ACTOR_USER, auditActor: AUDIT_ACTOR },
				NOW,
			),
		).rejects.toMatchObject({ errorType: 'error-ai-engine-disagrees' });

		expect(users.activateReservedAgentBot).not.toHaveBeenCalled();
		expect(addUsersToRoomMethod).not.toHaveBeenCalled();
	});

	it('never exposes instructions on ai-agents.list, hides inaccessible rooms, and exposes instructions on ai-agents.info (R04)', async () => {
		const built = buildAgentRecord110({
			id: 'seat-1',
			version: 100,
			updatedAt: NOW.toISOString(),
			name: 'Docs Helper',
			instructions: 'TOP SECRET PROMPT PROSE',
			model: { provider: 'openrouter', id: 'openai/gpt-4o-mini' },
			tools: ['docs_search'],
			skills: { commit: SKILLS_COMMIT, ids: ['public-docs'] },
			status: 'published',
			chat: { claim: '11111111-2222-4333-8444-555555555555', rooms: ['room-general'] },
		});
		const engine = makeFreshEngine([
			{ seatId: 'seat-1', state: 'claimed', acceptedVersion: 100, admittedQuestionSeen: true, reason: 'ready' },
			{ seatId: 'seat-2', botId: 'bot-2', state: 'provisioned', allowedRooms: ['room-general', 'room-hidden'] },
		]);
		users.findOneById.mockResolvedValue({
			_id: 'bot-1',
			username: 'ai-agent-1',
			type: 'bot',
			roles: ['bot'],
			active: true,
			aiAgents: { engineId: 'eng-1', activatedAt: NOW },
		});
		subscriptions.findOneByRoomIdAndUserId.mockReset().mockResolvedValue({ _id: 'sub-1' });
		aiEngines.findAllSortedByName.mockReturnValue({ toArray: async () => [engine] });
		aiSeats.findAllSortedBySeatId.mockReturnValue({
			toArray: async () => [
				makeSeat({ seatId: 'seat-1', state: 'claimed', agentId: 'agent-1' }),
				makeSeat({
					_id: 'seat-doc-2',
					seatId: 'seat-2',
					botUserId: 'bot-2',
					state: 'registered',
					allowedRoomIds: ['room-general', 'room-hidden'],
				}),
			],
		});
		aiAgents.findAllSortedByCreatedAt.mockReturnValue({
			toArray: async () => [
				{
					_id: 'agent-1',
					engineId: 'eng-1',
					seatId: 'seat-1',
					claim: '11111111-2222-4333-8444-555555555555',
					lastVersion: 100,
					headVersion: 100,
					status: 'published',
					createdAt: NOW,
				},
			],
		});
		aiAgentRevisions.findOneByAgentIdAndVersion.mockResolvedValue({
			agentId: 'agent-1',
			version: 100,
			bytes: built.binary,
			digest: built.digest,
		});
		rooms.findOneById.mockImplementation(async (rid: string) => ({ _id: rid, name: rid, t: 'c' }));

		const listed = await listAiAgentsForActor(ACTOR_USER, NOW);
		expect(JSON.stringify(listed)).not.toContain('TOP SECRET PROMPT PROSE');
		expect(listed.agents[0]).not.toHaveProperty('instructions');
		expect(listed.agents[0].readiness).toBe('ready');
		expect(listed.engines[0].eligibleRooms.map((r) => r._id)).toEqual(['room-general']);

		// Info returns instructions.
		aiAgents.findOneById.mockResolvedValue({
			_id: 'agent-1',
			engineId: 'eng-1',
			seatId: 'seat-1',
			claim: '11111111-2222-4333-8444-555555555555',
			lastVersion: 100,
			headVersion: 100,
			status: 'published',
			createdAt: NOW,
		});
		aiSeats.findOneBySeatId.mockResolvedValue(makeSeat({ state: 'claimed', agentId: 'agent-1' }));
		aiEngines.findOneById.mockResolvedValue(engine);

		const info = await getAiAgentInfo('agent-1', NOW);
		expect(info.instructions).toBe('TOP SECRET PROMPT PROSE');
	});

	it('reports bot-invalid when a published or previously activated bot is deactivated and room-invalid when a room breaks eligibility (R12)', async () => {
		const built = buildAgentRecord110({
			id: 'seat-1',
			version: 100,
			updatedAt: NOW.toISOString(),
			name: 'Docs Helper',
			instructions: 'Answer from docs.',
			model: { provider: 'openrouter', id: 'openai/gpt-4o-mini' },
			tools: ['docs_search'],
			skills: { commit: SKILLS_COMMIT, ids: ['public-docs'] },
			status: 'published',
			chat: { claim: '11111111-2222-4333-8444-555555555555', rooms: ['room-general'] },
		});
		const engine = makeFreshEngine([
			{ seatId: 'seat-1', state: 'claimed', acceptedVersion: 100, admittedQuestionSeen: true, reason: 'ready' },
		]);
		const agentDoc = {
			_id: 'agent-1',
			engineId: 'eng-1',
			seatId: 'seat-1',
			claim: '11111111-2222-4333-8444-555555555555',
			lastVersion: 100,
			headVersion: 100,
			status: 'published' as const,
			createdAt: NOW,
		};
		aiEngines.findAllSortedByName.mockReturnValue({ toArray: async () => [engine] });
		aiSeats.findAllSortedBySeatId.mockReturnValue({ toArray: async () => [makeSeat({ state: 'claimed', agentId: 'agent-1' })] });
		aiAgents.findAllSortedByCreatedAt.mockReturnValue({ toArray: async () => [agentDoc] });
		aiAgentRevisions.findOneByAgentIdAndVersion.mockResolvedValue({
			agentId: 'agent-1',
			version: 100,
			bytes: built.binary,
			digest: built.digest,
		});

		// Deactivated bot -> bot-invalid
		users.findOneById.mockResolvedValue({
			_id: 'bot-1',
			username: 'ai-agent-1',
			type: 'bot',
			roles: ['bot'],
			active: false,
			inactiveReason: 'deactivated',
			aiAgents: { engineId: 'eng-1', activatedAt: NOW },
		});
		const listedBotInvalid = await listAiAgentsForActor(ACTOR_USER, NOW);
		expect(listedBotInvalid.agents[0].readiness).toBe('bot-invalid');

		// Valid active bot, but room became read-only -> room-invalid
		users.findOneById.mockResolvedValue({
			_id: 'bot-1',
			username: 'ai-agent-1',
			type: 'bot',
			roles: ['bot'],
			active: true,
			aiAgents: { engineId: 'eng-1', activatedAt: NOW },
		});
		rooms.findOneById.mockResolvedValue({ _id: 'room-general', name: 'general', t: 'c', ro: true });
		const listedRoomInvalid = await listAiAgentsForActor(ACTOR_USER, NOW);
		expect(listedRoomInvalid.agents[0].readiness).toBe('room-invalid');
	});

	it('validates bot integrity, room flags, and duplicate seat refusal on seats.register and seats.retire (R05, R10b, R12)', async () => {
		aiEngines.findOneById.mockResolvedValue(makeFreshEngine());
		aiSeats.registerSeat.mockResolvedValue({ insertedId: 'seat-doc-1' });

		// Valid registration succeeds.
		const registered = await registerSeatForEngine(
			{
				engineId: 'eng-1',
				seatId: 'seat-1',
				botUserId: 'bot-1',
				allowedRoomIds: ['room-general'],
				allowedToolIds: ['docs_search'],
				allowedRouteIds: ['openrouter/openai/gpt-4o-mini'],
			},
			{ userId: 'admin-1', auditActor: AUDIT_ACTOR },
			NOW,
		);
		expect(registered.state).toBe('registered');

		// Duplicate key error (e.g. retired seat id re-registration) is refused.
		aiSeats.registerSeat.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 11000 }));
		await expect(
			registerSeatForEngine(
				{
					engineId: 'eng-1',
					seatId: 'seat-1',
					botUserId: 'bot-1',
					allowedRoomIds: ['room-general'],
					allowedToolIds: ['docs_search'],
					allowedRouteIds: ['openrouter/openai/gpt-4o-mini'],
				},
				{ userId: 'admin-1', auditActor: AUDIT_ACTOR },
				NOW,
			),
		).rejects.toBeInstanceOf(AiAgentActionError);

		// Active or extra-role bot is refused.
		users.findOneById.mockResolvedValueOnce({
			_id: 'bot-1',
			type: 'bot',
			roles: ['bot', 'admin'],
			active: false,
			aiAgents: { engineId: 'eng-1' },
		});
		await expect(
			registerSeatForEngine(
				{
					engineId: 'eng-1',
					seatId: 'seat-2',
					botUserId: 'bot-1',
					allowedRoomIds: ['room-general'],
					allowedToolIds: ['docs_search'],
					allowedRouteIds: ['openrouter/openai/gpt-4o-mini'],
				},
				{ userId: 'admin-1', auditActor: AUDIT_ACTOR },
				NOW,
			),
		).rejects.toMatchObject({ errorType: 'error-ai-bot-invalid' });

		// Retire succeeds once and refuses on second retire.
		aiSeats.findOneBySeatId.mockResolvedValue(makeSeat());
		aiSeats.retireSeat.mockResolvedValueOnce({ modifiedCount: 1 }).mockResolvedValueOnce({ modifiedCount: 0 });
		await expect(retireSeatById('seat-1', { userId: 'admin-1', auditActor: AUDIT_ACTOR })).resolves.toBeUndefined();
		await expect(retireSeatById('seat-1', { userId: 'admin-1', auditActor: AUDIT_ACTOR })).rejects.toMatchObject({
			errorType: 'error-ai-seat-already-retired',
		});
	});

	it('derives every Step 3 §10 page readiness state accurately (only admittedQuestionSeen yields ready)', () => {
		const seat = makeSeat({ state: 'claimed', agentId: 'a1' });
		const engWaiting = makeFreshEngine([{ seatId: 'seat-1', state: 'claimed', acceptedVersion: 0 }]);
		expect(deriveAgentReadiness({ headVersion: 5, status: 'published' }, seat, engWaiting, NOW.getTime()).readiness).toBe(
			'published, waiting for engine',
		);

		const engNotProved = makeFreshEngine([
			{ seatId: 'seat-1', state: 'claimed', acceptedVersion: 5, identity120Seen: true, admittedQuestionSeen: false },
		]);
		expect(deriveAgentReadiness({ headVersion: 5, status: 'published' }, seat, engNotProved, NOW.getTime()).readiness).toBe(
			'engine ready, app not proved',
		);

		const engReady = makeFreshEngine([
			{ seatId: 'seat-1', state: 'claimed', acceptedVersion: 5, identity120Seen: true, admittedQuestionSeen: true },
		]);
		expect(deriveAgentReadiness({ headVersion: 5, status: 'published' }, seat, engReady, NOW.getTime()).readiness).toBe('ready');

		const engDisabledPending = makeFreshEngine([{ seatId: 'seat-1', state: 'claimed', acceptedVersion: 5, reason: 'ready' }]);
		expect(deriveAgentReadiness({ headVersion: 6, status: 'disabled' }, seat, engDisabledPending, NOW.getTime())).toMatchObject({
			readiness: 'disabled',
			engineConfirmed: false,
		});

		const engDisabledConfirmed = makeFreshEngine([{ seatId: 'seat-1', state: 'claimed', acceptedVersion: 6, reason: 'record-disabled' }]);
		expect(deriveAgentReadiness({ headVersion: 6, status: 'disabled' }, seat, engDisabledConfirmed, NOW.getTime())).toMatchObject({
			readiness: 'disabled',
			engineConfirmed: true,
		});
	});
});
