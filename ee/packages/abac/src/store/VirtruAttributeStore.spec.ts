import { VirtruAttributeStore } from './VirtruAttributeStore';

const usersFindOneById = jest.fn();
jest.mock('@rocket.chat/models', () => ({ Users: { findOneById: (...a: unknown[]) => usersFindOneById(...a) } }));

const cfg = {
	baseUrl: 'http://pdp',
	clientId: 'c',
	clientSecret: 's',
	oidcEndpoint: 'http://o',
	defaultEntityKey: 'emailAddress' as const,
	attributeNamespace: 'example.com',
};
const actor = { _id: 'u1', username: 'bob', name: 'Bob' };

const mkClient = (over: Partial<Record<'isAvailable' | 'apiCall' | 'getConfig', jest.Mock>> = {}) =>
	({
		isAvailable: over.isAvailable ?? jest.fn().mockResolvedValue(true),
		apiCall: over.apiCall ?? jest.fn(),
		getConfig: over.getConfig ?? jest.fn().mockReturnValue(cfg),
	}) as any;

beforeEach(() => usersFindOneById.mockReset().mockResolvedValue({ _id: 'u1', emails: [{ address: 'bob@x.com' }], username: 'bob' }));

describe('VirtruAttributeStore.entitlementsOf / list', () => {
	it('parses FQN map keys into grouped {key,values}', async () => {
		const apiCall = jest.fn().mockResolvedValue({
			entitlements: [
				{
					actionsPerAttributeValueFqn: {
						'https://example.com/attr/clearance/value/secret': {},
						'https://example.com/attr/clearance/value/topsecret': {},
						'https://example.com/attr/team/value/blue': {},
					},
				},
			],
		});
		const store = new VirtruAttributeStore(mkClient({ apiCall }));
		const r = await store.list(actor);
		expect(r.attributes).toEqual(
			expect.arrayContaining([
				{ key: 'clearance', values: expect.arrayContaining(['secret', 'topsecret']) },
				{ key: 'team', values: ['blue'] },
			]),
		);
	});

	it('isAvailable() false => throws PdpUnavailable, no GetEntitlements', async () => {
		const apiCall = jest.fn();
		const store = new VirtruAttributeStore(mkClient({ isAvailable: jest.fn().mockResolvedValue(false), apiCall }));
		await expect(store.list(actor)).rejects.toMatchObject({ code: 'error-pdp-unavailable' });
		expect(apiCall).not.toHaveBeenCalled();
	});

	it('N concurrent calls for same entity before resolve => exactly one round-trip', async () => {
		let resolve!: (v: unknown) => void;
		const apiCall = jest.fn().mockReturnValue(
			new Promise((r) => {
				resolve = r;
			}),
		);
		const store = new VirtruAttributeStore(mkClient({ apiCall }));
		const p = Promise.all([store.entitlementsOf(actor), store.entitlementsOf(actor), store.entitlementsOf(actor)]);
		resolve({ entitlements: [{ actionsPerAttributeValueFqn: { 'https://example.com/attr/k/value/v': {} } }] });
		await p;
		expect(apiCall).toHaveBeenCalledTimes(1);
	});

	it('cache keyed by resolved entity id (different entity => separate fetch)', async () => {
		const apiCall = jest.fn().mockResolvedValue({ entitlements: [{ actionsPerAttributeValueFqn: {} }] });
		const store = new VirtruAttributeStore(mkClient({ apiCall }));
		await store.entitlementsOf(actor);
		usersFindOneById.mockResolvedValue({ _id: 'u2', emails: [{ address: 'alice@x.com' }], username: 'alice' });
		await store.entitlementsOf({ _id: 'u2', username: 'alice', name: 'A' });
		expect(apiCall).toHaveBeenCalledTimes(2);
	});

	it('validateAssignable rejects an unpossessed value', async () => {
		const apiCall = jest
			.fn()
			.mockResolvedValue({ entitlements: [{ actionsPerAttributeValueFqn: { 'https://example.com/attr/clearance/value/secret': {} } }] });
		const store = new VirtruAttributeStore(mkClient({ apiCall }));
		await expect(store.validateAssignable([{ key: 'clearance', values: ['secret'] }], actor)).resolves.toBeUndefined();
		await expect(store.validateAssignable([{ key: 'clearance', values: ['topsecret'] }], actor)).rejects.toMatchObject({
			code: 'error-invalid-attribute-values',
		});
		expect(apiCall).toHaveBeenCalledTimes(1);
	});

	it('failed fetch is NOT cached: second call after PDP recovery succeeds', async () => {
		const isAvailable = jest.fn().mockResolvedValue(false);
		const apiCall = jest.fn().mockResolvedValue({
			entitlements: [{ actionsPerAttributeValueFqn: { 'https://example.com/attr/clearance/value/secret': {} } }],
		});
		const store = new VirtruAttributeStore(mkClient({ isAvailable, apiCall }));

		await expect(store.entitlementsOf(actor)).rejects.toMatchObject({ code: 'error-pdp-unavailable' });

		isAvailable.mockResolvedValue(true);

		const result = await store.entitlementsOf(actor);
		expect(result.get('clearance')).toEqual(new Set(['secret']));
		expect(apiCall).toHaveBeenCalledTimes(1);
	});

	it('unresolvable entity => entity-resolution error', async () => {
		usersFindOneById.mockResolvedValue({ _id: 'u1', emails: [], username: 'bob' });
		const store = new VirtruAttributeStore(mkClient());
		await expect(store.list(actor)).rejects.toMatchObject({ code: 'error-virtru-entity-resolution-failed' });
	});
});

describe('VirtruAttributeStore.scopeRoomsPage', () => {
	const rooms = [
		{ _id: 'rPermit', abacAttributes: [{ key: 'clearance', values: ['secret'] }] },
		{ _id: 'rDeny', abacAttributes: [{ key: 'clearance', values: ['topsecret'] }] },
		{ _id: 'rNone', abacAttributes: [] },
	];
	it('PERMIT unchanged, DENY redacted+flagged, no-attr passes through, ONE round-trip, order kept', async () => {
		const apiCall = jest.fn().mockResolvedValue({
			decisionResponses: [
				{
					resourceDecisions: [
						{ ephemeralResourceId: 'rPermit', decision: 'DECISION_PERMIT' },
						{ ephemeralResourceId: 'rDeny', decision: 'DECISION_DENY' },
					],
				},
			],
		});
		const store = new VirtruAttributeStore(mkClient({ apiCall }));
		const out = await store.scopeRoomsPage(rooms, actor);
		expect(out.map((r) => r._id)).toEqual(['rPermit', 'rDeny', 'rNone']);
		expect(out[0].abacAttributes).toEqual([{ key: 'clearance', values: ['secret'] }]);
		expect(out[0]).not.toHaveProperty('abacAttributesRedacted');
		expect(out[1].abacAttributes).toEqual([]);
		expect(out[1].abacAttributesRedacted).toBe(true);
		expect(out[2]).not.toHaveProperty('abacAttributesRedacted');
		expect(apiCall).toHaveBeenCalledTimes(1);
	});
	it('isAvailable false => every attr-room redacted, no throw, no apiCall', async () => {
		const apiCall = jest.fn();
		const store = new VirtruAttributeStore(mkClient({ isAvailable: jest.fn().mockResolvedValue(false), apiCall }));
		const out = await store.scopeRoomsPage(rooms, actor);
		expect(out[0].abacAttributesRedacted).toBe(true);
		expect(out[1].abacAttributesRedacted).toBe(true);
		expect(out[2]).not.toHaveProperty('abacAttributesRedacted');
		expect(apiCall).not.toHaveBeenCalled();
	});
	it('decision call throws => fail-closed redact all, no throw', async () => {
		const apiCall = jest.fn().mockRejectedValue(new Error('boom'));
		const store = new VirtruAttributeStore(mkClient({ apiCall }));
		const out = await store.scopeRoomsPage(rooms, actor);
		expect(out[0].abacAttributesRedacted).toBe(true);
		expect(out[1].abacAttributesRedacted).toBe(true);
	});
});

describe('VirtruAttributeStore.assertCanModifyRoom', () => {
	it("resolves when PDP PERMITs the room's current attributes", async () => {
		const apiCall = jest
			.fn()
			.mockResolvedValue({ decisionResponses: [{ resourceDecisions: [{ ephemeralResourceId: 'r', decision: 'DECISION_PERMIT' }] }] });
		await expect(
			new VirtruAttributeStore(mkClient({ apiCall })).assertCanModifyRoom(
				{ _id: 'r', abacAttributes: [{ key: 'k', values: ['v'] }] },
				actor,
			),
		).resolves.toBeUndefined();
	});

	it('rejects when PDP DENYs', async () => {
		const apiCall = jest
			.fn()
			.mockResolvedValue({ decisionResponses: [{ resourceDecisions: [{ ephemeralResourceId: 'r', decision: 'DECISION_DENY' }] }] });
		await expect(
			new VirtruAttributeStore(mkClient({ apiCall })).assertCanModifyRoom(
				{ _id: 'r', abacAttributes: [{ key: 'k', values: ['v'] }] },
				actor,
			),
		).rejects.toMatchObject({ code: 'error-pdp-unavailable' });
	});

	it('resolves when the room has no current attributes', async () => {
		await expect(
			new VirtruAttributeStore(mkClient()).assertCanModifyRoom({ _id: 'r', abacAttributes: [] }, actor),
		).resolves.toBeUndefined();
	});

	it('rejects (fail-closed) when Virtru is unreachable', async () => {
		await expect(
			new VirtruAttributeStore(mkClient({ isAvailable: jest.fn().mockResolvedValue(false) })).assertCanModifyRoom(
				{ _id: 'r', abacAttributes: [{ key: 'k', values: ['v'] }] },
				actor,
			),
		).rejects.toMatchObject({ code: 'error-pdp-unavailable' });
	});
});
