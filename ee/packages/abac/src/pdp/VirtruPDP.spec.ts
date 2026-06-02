import { OnlyCompliantCanBeAddedToRoomError, PdpHealthCheckError } from '../errors';
import { VirtruPDP } from './VirtruPDP';

const serverFetchMock = jest.fn();
jest.mock('@rocket.chat/server-fetch', () => ({ serverFetch: (...a: unknown[]) => serverFetchMock(...a) }));

const usersFindOneById = jest.fn();
const usersFindByUsernames = jest.fn();
const usersFindActiveByRoomIds = jest.fn();
const roomsFindPrivateRoomsByIdsWithAbacAttributes = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Users: {
		findOneById: (...a: unknown[]) => usersFindOneById(...a),
		findByUsernames: (...a: unknown[]) => usersFindByUsernames(...a),
		findActiveByRoomIds: (...a: unknown[]) => usersFindActiveByRoomIds(...a),
	},
	Rooms: {
		findPrivateRoomsByIdsWithAbacAttributes: (...a: unknown[]) => roomsFindPrivateRoomsByIdsWithAbacAttributes(...a),
	},
}));

const cfg = {
	baseUrl: 'http://pdp',
	clientId: 'cid',
	clientSecret: 'sec',
	oidcEndpoint: 'http://oidc',
	defaultEntityKey: 'emailAddress' as const,
	attributeNamespace: 'example.com',
};

const okJson = (body: unknown) => ({ ok: true, status: 200, json: async () => body, text: async () => '' });

const mkClient = (over: Partial<Record<'isAvailable' | 'apiCall' | 'getConfig' | 'getClientTokenForHealthCheck', jest.Mock>> = {}) =>
	({
		isAvailable: over.isAvailable ?? jest.fn().mockResolvedValue(true),
		apiCall: over.apiCall ?? jest.fn(),
		getConfig: over.getConfig ?? jest.fn().mockReturnValue(cfg),
		getClientTokenForHealthCheck: over.getClientTokenForHealthCheck ?? jest.fn().mockResolvedValue('hc-tok'),
	}) as any;

const cursor = <T>(items: T[]) => ({ toArray: () => Promise.resolve(items) });
const asyncIterable = <T>(items: T[]) => ({
	[Symbol.asyncIterator]: () => {
		let i = 0;
		return {
			next: () => Promise.resolve(i < items.length ? { value: items[i++], done: false } : { value: undefined, done: true }),
		};
	},
});

const user = (over: Partial<{ _id: string; username: string; emails: { address: string }[]; __rooms: string[] }> = {}) => ({
	_id: 'u1',
	username: 'bob',
	emails: [{ address: 'bob@x.com' }],
	...over,
});

beforeEach(() => {
	serverFetchMock.mockReset();
	usersFindOneById.mockReset();
	usersFindByUsernames.mockReset();
	usersFindActiveByRoomIds.mockReset();
	roomsFindPrivateRoomsByIdsWithAbacAttributes.mockReset();
});

const permitFor = (ids: string[]) => ({
	decisionResponses: [
		{
			resourceDecisions: ids.map((id) => ({ ephemeralResourceId: id, decision: 'DECISION_PERMIT' })),
		},
	],
});
const denyFor = (ids: string[]) => ({
	decisionResponses: [
		{
			resourceDecisions: ids.map((id) => ({ ephemeralResourceId: id, decision: 'DECISION_DENY' })),
		},
	],
});

describe('VirtruPDP.isAvailable', () => {
	it('delegates to client.isAvailable', async () => {
		const isAvailable = jest.fn().mockResolvedValue(true);
		const pdp = new VirtruPDP(mkClient({ isAvailable }));
		expect(await pdp.isAvailable()).toBe(true);
		expect(isAvailable).toHaveBeenCalled();
	});
});

describe('VirtruPDP.canAccessObject', () => {
	const room = { _id: 'r1', abacAttributes: [{ key: 'clearance', values: ['secret'] }] };

	it('grants when room has no abac attributes (no DB or API call)', async () => {
		const apiCall = jest.fn();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const r = await pdp.canAccessObject({ _id: 'r0', abacAttributes: [] } as any, { _id: 'u1' });
		expect(r).toEqual({ granted: true });
		expect(usersFindOneById).not.toHaveBeenCalled();
		expect(apiCall).not.toHaveBeenCalled();
	});

	it('denies when DB has no such user', async () => {
		usersFindOneById.mockResolvedValue(null);
		const apiCall = jest.fn();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const r = await pdp.canAccessObject(room as any, { _id: 'u1' });
		expect(r).toEqual({ granted: false });
		expect(apiCall).not.toHaveBeenCalled();
	});

	it('denies when user has no entity key (no API call)', async () => {
		usersFindOneById.mockResolvedValue(user({ emails: [] }));
		const apiCall = jest.fn();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const r = await pdp.canAccessObject(room as any, { _id: 'u1' });
		expect(r).toEqual({ granted: false });
		expect(apiCall).not.toHaveBeenCalled();
	});

	it('grants on DECISION_PERMIT and forwards entity + fqn to client', async () => {
		usersFindOneById.mockResolvedValue(user());
		const apiCall = jest.fn().mockResolvedValue(permitFor(['r1']));
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const r = await pdp.canAccessObject(room as any, { _id: 'u1' });
		expect(r).toEqual({ granted: true });
		const [endpoint, body] = apiCall.mock.calls[0];
		expect(endpoint).toBe('/authorization.v2.AuthorizationService/GetDecisionBulk');
		expect(body.decisionRequests[0].entityIdentifier.entityChain.entities[0]).toEqual({ emailAddress: 'bob@x.com' });
		expect(body.decisionRequests[0].resources[0]).toEqual({
			ephemeralId: 'r1',
			attributeValues: { fqns: ['https://example.com/attr/clearance/value/secret'] },
		});
	});

	it('denies with userToRemove on DECISION_DENY', async () => {
		const fullUser = user();
		usersFindOneById.mockResolvedValue(fullUser);
		const apiCall = jest.fn().mockResolvedValue(denyFor(['r1']));
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const r = await pdp.canAccessObject(room as any, { _id: 'u1' });
		expect(r.granted).toBe(false);
		expect(r.userToRemove).toBe(fullUser);
	});

	it('denies WITHOUT userToRemove on inconclusive decision', async () => {
		usersFindOneById.mockResolvedValue(user());
		const apiCall = jest.fn().mockResolvedValue({ decisionResponses: [{ resourceDecisions: [{ decision: 'DECISION_UNSPECIFIED' }] }] });
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const r = await pdp.canAccessObject(room as any, { _id: 'u1' });
		expect(r).toEqual({ granted: false });
	});

	it('denies WITHOUT userToRemove when response has no resourceDecisions', async () => {
		usersFindOneById.mockResolvedValue(user());
		const apiCall = jest.fn().mockResolvedValue({ decisionResponses: [{}] });
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const r = await pdp.canAccessObject(room as any, { _id: 'u1' });
		expect(r).toEqual({ granted: false });
	});

	it('uses oidcIdentifier entity shape when defaultEntityKey is oidcIdentifier', async () => {
		usersFindOneById.mockResolvedValue(user());
		const apiCall = jest.fn().mockResolvedValue(permitFor(['r1']));
		const oidcCfg = { ...cfg, defaultEntityKey: 'oidcIdentifier' as const };
		const pdp = new VirtruPDP(mkClient({ apiCall, getConfig: jest.fn().mockReturnValue(oidcCfg) }));
		await pdp.canAccessObject(room as any, { _id: 'u1' });
		const [, body] = apiCall.mock.calls[0];
		expect(body.decisionRequests[0].entityIdentifier.entityChain.entities[0]).toEqual({ id: 'bob' });
	});
});

describe('VirtruPDP.checkUsernamesMatchAttributes', () => {
	const room = { _id: 'r1' } as any;
	const attrs = [{ key: 'clearance', values: ['secret'] }];

	it('returns without API when usernames is empty', async () => {
		const apiCall = jest.fn();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		await pdp.checkUsernamesMatchAttributes([], attrs, room);
		expect(apiCall).not.toHaveBeenCalled();
		expect(usersFindByUsernames).not.toHaveBeenCalled();
	});

	it('returns without API when attributes is empty', async () => {
		const apiCall = jest.fn();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		await pdp.checkUsernamesMatchAttributes(['bob'], [], room);
		expect(apiCall).not.toHaveBeenCalled();
	});

	it('throws when any user has no entity key', async () => {
		usersFindByUsernames.mockReturnValue(cursor([user({ emails: [] })]));
		const apiCall = jest.fn();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		await expect(pdp.checkUsernamesMatchAttributes(['bob'], attrs, room)).rejects.toBeInstanceOf(OnlyCompliantCanBeAddedToRoomError);
		expect(apiCall).not.toHaveBeenCalled();
	});

	it('throws when zero decision requests can be built (all users filtered)', async () => {
		usersFindByUsernames.mockReturnValue(cursor([]));
		const apiCall = jest.fn();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		await expect(pdp.checkUsernamesMatchAttributes(['ghost'], attrs, room)).rejects.toBeInstanceOf(OnlyCompliantCanBeAddedToRoomError);
		expect(apiCall).not.toHaveBeenCalled();
	});

	it('resolves when all users get DECISION_PERMIT', async () => {
		usersFindByUsernames.mockReturnValue(cursor([user(), user({ _id: 'u2', username: 'alice', emails: [{ address: 'a@x.com' }] })]));
		const apiCall = jest.fn().mockResolvedValue({
			decisionResponses: [
				{ resourceDecisions: [{ ephemeralResourceId: 'r1', decision: 'DECISION_PERMIT' }] },
				{ resourceDecisions: [{ ephemeralResourceId: 'r1', decision: 'DECISION_PERMIT' }] },
			],
		});
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		await expect(pdp.checkUsernamesMatchAttributes(['bob', 'alice'], attrs, room)).resolves.toBeUndefined();
	});

	it('throws when any user is DENIED', async () => {
		usersFindByUsernames.mockReturnValue(cursor([user(), user({ _id: 'u2', username: 'alice', emails: [{ address: 'a@x.com' }] })]));
		const apiCall = jest.fn().mockResolvedValue({
			decisionResponses: [
				{ resourceDecisions: [{ ephemeralResourceId: 'r1', decision: 'DECISION_PERMIT' }] },
				{ resourceDecisions: [{ ephemeralResourceId: 'r1', decision: 'DECISION_DENY' }] },
			],
		});
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		await expect(pdp.checkUsernamesMatchAttributes(['bob', 'alice'], attrs, room)).rejects.toBeInstanceOf(
			OnlyCompliantCanBeAddedToRoomError,
		);
	});

	it('throws when a decision response is empty (no resourceDecisions)', async () => {
		usersFindByUsernames.mockReturnValue(cursor([user()]));
		const apiCall = jest.fn().mockResolvedValue({ decisionResponses: [{}] });
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		await expect(pdp.checkUsernamesMatchAttributes(['bob'], attrs, room)).rejects.toBeInstanceOf(OnlyCompliantCanBeAddedToRoomError);
	});
});

describe('VirtruPDP.onRoomAttributesChanged', () => {
	const room = { _id: 'r1', t: 'p', teamMain: false, abacAttributes: [] } as any;
	const newAttrs = [{ key: 'clearance', values: ['secret'] }];

	it('returns [] when no new attributes (no DB scan)', async () => {
		const apiCall = jest.fn();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const result = await pdp.onRoomAttributesChanged(room, []);
		expect(result).toEqual([]);
		expect(usersFindActiveByRoomIds).not.toHaveBeenCalled();
	});

	it('returns user as non-compliant when entity key missing (no API request for that user)', async () => {
		const u = user({ emails: [] });
		usersFindActiveByRoomIds.mockReturnValue(asyncIterable([u]));
		const apiCall = jest.fn();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const result = await pdp.onRoomAttributesChanged(room, newAttrs);
		expect(result).toEqual([u]);
		expect(apiCall).not.toHaveBeenCalled();
	});

	it('returns [] when all users are DECISION_PERMIT', async () => {
		usersFindActiveByRoomIds.mockReturnValue(asyncIterable([user()]));
		const apiCall = jest.fn().mockResolvedValue(permitFor(['r1']));
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const result = await pdp.onRoomAttributesChanged(room, newAttrs);
		expect(result).toEqual([]);
	});

	it('returns users that are DENIED', async () => {
		const u1 = user();
		const u2 = user({ _id: 'u2', username: 'alice', emails: [{ address: 'a@x.com' }] });
		usersFindActiveByRoomIds.mockReturnValue(asyncIterable([u1, u2]));
		const apiCall = jest.fn().mockResolvedValue({
			decisionResponses: [
				{ resourceDecisions: [{ ephemeralResourceId: 'r1', decision: 'DECISION_PERMIT' }] },
				{ resourceDecisions: [{ ephemeralResourceId: 'r1', decision: 'DECISION_DENY' }] },
			],
		});
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const result = await pdp.onRoomAttributesChanged(room, newAttrs);
		expect(result).toEqual([u2]);
	});

	it('treats empty resourceDecisions as non-compliant', async () => {
		const u = user();
		usersFindActiveByRoomIds.mockReturnValue(asyncIterable([u]));
		const apiCall = jest.fn().mockResolvedValue({ decisionResponses: [{ resourceDecisions: [] }] });
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const result = await pdp.onRoomAttributesChanged(room, newAttrs);
		expect(result).toEqual([u]);
	});

	it('returns only entity-keyless users when ALL users lack entity keys (no API call)', async () => {
		const u = user({ emails: [] });
		usersFindActiveByRoomIds.mockReturnValue(asyncIterable([u]));
		const apiCall = jest.fn();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const result = await pdp.onRoomAttributesChanged(room, newAttrs);
		expect(result).toEqual([u]);
		expect(apiCall).not.toHaveBeenCalled();
	});
});

describe('VirtruPDP.onSubjectAttributesChanged', () => {
	it('returns [] when user has no __rooms', async () => {
		const pdp = new VirtruPDP(mkClient());
		const result = await pdp.onSubjectAttributesChanged(user() as any, []);
		expect(result).toEqual([]);
		expect(roomsFindPrivateRoomsByIdsWithAbacAttributes).not.toHaveBeenCalled();
	});

	it('returns [] when no ABAC rooms among __rooms', async () => {
		roomsFindPrivateRoomsByIdsWithAbacAttributes.mockReturnValue(cursor([]));
		const pdp = new VirtruPDP(mkClient());
		const result = await pdp.onSubjectAttributesChanged(user({ __rooms: ['r1'] }) as any, []);
		expect(result).toEqual([]);
	});

	it('returns ALL abac rooms when user has no entity key (no API call)', async () => {
		const rooms = [{ _id: 'r1', abacAttributes: [{ key: 'k', values: ['v'] }] }];
		roomsFindPrivateRoomsByIdsWithAbacAttributes.mockReturnValue(cursor(rooms));
		const apiCall = jest.fn();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const result = await pdp.onSubjectAttributesChanged(user({ __rooms: ['r1'], emails: [] }) as any, []);
		expect(result).toEqual(rooms);
		expect(apiCall).not.toHaveBeenCalled();
	});

	it('returns only DENIED rooms when mixed decisions come back', async () => {
		const rooms = [
			{ _id: 'rP', abacAttributes: [{ key: 'k', values: ['v'] }] },
			{ _id: 'rD', abacAttributes: [{ key: 'k', values: ['v'] }] },
		];
		roomsFindPrivateRoomsByIdsWithAbacAttributes.mockReturnValue(cursor(rooms));
		const apiCall = jest.fn().mockResolvedValue({
			decisionResponses: [
				{ resourceDecisions: [{ ephemeralResourceId: 'rP', decision: 'DECISION_PERMIT' }] },
				{ resourceDecisions: [{ ephemeralResourceId: 'rD', decision: 'DECISION_DENY' }] },
			],
		});
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const result = await pdp.onSubjectAttributesChanged(user({ __rooms: ['rP', 'rD'] }) as any, []);
		expect(result).toEqual([rooms[1]]);
	});

	it('splits >200 rooms into multiple decision batches', async () => {
		const total = 401;
		const rooms = Array.from({ length: total }, (_, i) => ({ _id: `r${i}`, abacAttributes: [{ key: 'k', values: ['v'] }] }));
		roomsFindPrivateRoomsByIdsWithAbacAttributes.mockReturnValue(cursor(rooms));
		const apiCall = jest.fn().mockImplementation(async (_endpoint, body: any) => ({
			decisionResponses: body.decisionRequests.map((r: any) => ({
				resourceDecisions: [{ ephemeralResourceId: r.resources[0].ephemeralId, decision: 'DECISION_PERMIT' }],
			})),
		}));
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const result = await pdp.onSubjectAttributesChanged(user({ __rooms: rooms.map((r) => r._id) }) as any, []);
		expect(result).toEqual([]);
		expect(apiCall).toHaveBeenCalledTimes(3);
		const sizes = apiCall.mock.calls.map(([, body]: any[]) => body.decisionRequests.length);
		expect(sizes.sort((a, b) => a - b)).toEqual([1, 200, 200]);
	});
});

describe('VirtruPDP.evaluateUserRooms', () => {
	it('returns [] when entries is empty', async () => {
		const apiCall = jest.fn();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		expect(await pdp.evaluateUserRooms([])).toEqual([]);
		expect(apiCall).not.toHaveBeenCalled();
	});

	it('flags every room of a user lacking entity key, with no API call', async () => {
		const u = user({ emails: [] });
		const apiCall = jest.fn();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const rooms = [
			{ _id: 'r1', abacAttributes: [{ key: 'k', values: ['v'] }] },
			{ _id: 'r2', abacAttributes: [{ key: 'k', values: ['v'] }] },
		];
		const result = await pdp.evaluateUserRooms([{ user: u, rooms }]);
		expect(result).toEqual([
			{ user: u, room: rooms[0] },
			{ user: u, room: rooms[1] },
		]);
		expect(apiCall).not.toHaveBeenCalled();
	});

	it('returns [] when every entry+room PERMITs', async () => {
		const u = user();
		const rooms = [{ _id: 'r1', abacAttributes: [{ key: 'k', values: ['v'] }] }];
		const apiCall = jest.fn().mockResolvedValue(permitFor(['r1']));
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const result = await pdp.evaluateUserRooms([{ user: u, rooms }]);
		expect(result).toEqual([]);
	});

	it('returns non-compliant (user,room) pairs when a decision DENYs', async () => {
		const u = user();
		const rooms = [
			{ _id: 'rP', abacAttributes: [{ key: 'k', values: ['v'] }] },
			{ _id: 'rD', abacAttributes: [{ key: 'k', values: ['v'] }] },
		];
		const apiCall = jest.fn().mockResolvedValue({
			decisionResponses: [
				{ resourceDecisions: [{ ephemeralResourceId: 'rP', decision: 'DECISION_PERMIT' }] },
				{ resourceDecisions: [{ ephemeralResourceId: 'rD', decision: 'DECISION_DENY' }] },
			],
		});
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const result = await pdp.evaluateUserRooms([{ user: u, rooms }]);
		expect(result).toEqual([{ user: u, room: rooms[1] }]);
	});

	it('treats empty resourceDecisions as non-compliant', async () => {
		const u = user();
		const rooms = [{ _id: 'r1', abacAttributes: [{ key: 'k', values: ['v'] }] }];
		const apiCall = jest.fn().mockResolvedValue({ decisionResponses: [{ resourceDecisions: [] }] });
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const result = await pdp.evaluateUserRooms([{ user: u, rooms }]);
		expect(result).toEqual([{ user: u, room: rooms[0] }]);
	});
});

describe('VirtruPDP — PDP unreachable (decision call rejects)', () => {
	const pdpDown = () => jest.fn().mockRejectedValue(new Error('pdp down'));
	const room = { _id: 'r1', abacAttributes: [{ key: 'clearance', values: ['secret'] }] } as any;
	const attrs = [{ key: 'clearance', values: ['secret'] }];

	it('canAccessObject rejects (never silently grants) when the decision call fails', async () => {
		usersFindOneById.mockResolvedValue(user());
		const apiCall = pdpDown();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		await expect(pdp.canAccessObject(room, { _id: 'u1' })).rejects.toThrow('pdp down');
		expect(apiCall).toHaveBeenCalled();
	});

	it('checkUsernamesMatchAttributes rejects (never silently admits) when the decision call fails', async () => {
		usersFindByUsernames.mockReturnValue(cursor([user()]));
		const apiCall = pdpDown();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		await expect(pdp.checkUsernamesMatchAttributes(['bob'], attrs, room)).rejects.toThrow('pdp down');
		expect(apiCall).toHaveBeenCalled();
	});

	it('onRoomAttributesChanged rejects (never silently keeps everyone) when the decision call fails', async () => {
		usersFindActiveByRoomIds.mockReturnValue(asyncIterable([user()]));
		const apiCall = pdpDown();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		await expect(pdp.onRoomAttributesChanged(room, attrs)).rejects.toThrow('pdp down');
		expect(apiCall).toHaveBeenCalled();
	});

	it('onSubjectAttributesChanged rejects when the decision call fails', async () => {
		roomsFindPrivateRoomsByIdsWithAbacAttributes.mockReturnValue(cursor([room]));
		const apiCall = pdpDown();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		await expect(pdp.onSubjectAttributesChanged(user({ __rooms: ['r1'] }) as any, [])).rejects.toThrow('pdp down');
		expect(apiCall).toHaveBeenCalled();
	});

	it('evaluateUserRooms rejects when the decision call fails', async () => {
		const apiCall = pdpDown();
		const pdp = new VirtruPDP(mkClient({ apiCall }));
		const rooms = [{ _id: 'r1', abacAttributes: [{ key: 'k', values: ['v'] }] }];
		await expect(pdp.evaluateUserRooms([{ user: user(), rooms } as any])).rejects.toThrow('pdp down');
		expect(apiCall).toHaveBeenCalled();
	});
});

describe('VirtruPDP.getHealthStatus', () => {
	const platformOk = () => okJson({ status: 'SERVING' });
	const authOk = () => okJson({});

	it('passes when platform SERVING, IdP token resolves, authorization OK', async () => {
		serverFetchMock.mockResolvedValueOnce(platformOk()).mockResolvedValueOnce(authOk());
		const pdp = new VirtruPDP(mkClient());
		await expect(pdp.getHealthStatus()).resolves.toBeUndefined();
	});

	it('throws Platform_Failed when platform healthz returns non-ok HTTP', async () => {
		serverFetchMock.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) });
		const pdp = new VirtruPDP(mkClient());
		await expect(pdp.getHealthStatus()).rejects.toMatchObject({ message: 'ABAC_PDP_Health_Platform_Failed' });
	});

	it('throws Platform_Failed when platform healthz status is not SERVING', async () => {
		serverFetchMock.mockResolvedValueOnce(okJson({ status: 'NOT_SERVING' }));
		const pdp = new VirtruPDP(mkClient());
		await expect(pdp.getHealthStatus()).rejects.toBeInstanceOf(PdpHealthCheckError);
	});

	it('throws Platform_Failed when platform healthz status is missing', async () => {
		serverFetchMock.mockResolvedValueOnce(okJson({}));
		const pdp = new VirtruPDP(mkClient());
		await expect(pdp.getHealthStatus()).rejects.toMatchObject({ message: 'ABAC_PDP_Health_Platform_Failed' });
	});

	it('throws Platform_Failed when serverFetch itself rejects', async () => {
		serverFetchMock.mockRejectedValueOnce(new Error('network down'));
		const pdp = new VirtruPDP(mkClient());
		await expect(pdp.getHealthStatus()).rejects.toMatchObject({ message: 'ABAC_PDP_Health_Platform_Failed' });
	});

	it('throws IdP_Failed when token fetch errors', async () => {
		serverFetchMock.mockResolvedValueOnce(platformOk());
		const getClientTokenForHealthCheck = jest.fn().mockRejectedValue(new Error('idp down'));
		const pdp = new VirtruPDP(mkClient({ getClientTokenForHealthCheck }));
		await expect(pdp.getHealthStatus()).rejects.toMatchObject({ message: 'ABAC_PDP_Health_IdP_Failed' });
	});

	it('throws Authorization_Failed when authorization endpoint returns non-ok HTTP', async () => {
		serverFetchMock.mockResolvedValueOnce(platformOk()).mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });
		const pdp = new VirtruPDP(mkClient());
		await expect(pdp.getHealthStatus()).rejects.toMatchObject({ message: 'ABAC_PDP_Health_Authorization_Failed' });
	});

	it('throws Authorization_Failed when authorization fetch rejects', async () => {
		serverFetchMock.mockResolvedValueOnce(platformOk()).mockRejectedValueOnce(new Error('auth down'));
		const pdp = new VirtruPDP(mkClient());
		await expect(pdp.getHealthStatus()).rejects.toMatchObject({ message: 'ABAC_PDP_Health_Authorization_Failed' });
	});

	it('sends Bearer token to authorization endpoint', async () => {
		serverFetchMock.mockResolvedValueOnce(platformOk()).mockResolvedValueOnce(authOk());
		const pdp = new VirtruPDP(mkClient());
		await pdp.getHealthStatus();
		const authCall = serverFetchMock.mock.calls.find(([url]) => String(url).includes('GetEntitlements'));
		expect((authCall?.[1] as any).headers.Authorization).toBe('Bearer hc-tok');
	});
});
