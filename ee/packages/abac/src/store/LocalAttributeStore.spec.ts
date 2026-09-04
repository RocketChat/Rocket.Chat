import { LocalAttributeStore } from './LocalAttributeStore';

const ensureMock = jest.fn();
jest.mock('../helper', () => ({ ensureAttributeDefinitionsExist: (...a: unknown[]) => ensureMock(...a) }));
const findPaginated = jest.fn();
const usersFindOneById = jest.fn();
jest.mock('@rocket.chat/models', () => ({
	AbacAttributes: { findPaginated: (...a: unknown[]) => findPaginated(...a) },
	Users: { findOneById: (...a: unknown[]) => usersFindOneById(...a) },
}));

const actor = { _id: 'u', username: 'bob', name: 'Bob' };

beforeEach(() => {
	ensureMock.mockReset();
	findPaginated.mockReset();
	usersFindOneById.mockReset();
});

describe('LocalAttributeStore', () => {
	it('validateAssignable delegates to ensureAttributeDefinitionsExist', async () => {
		const attrs = [{ key: 'k', values: ['v'] }];
		await new LocalAttributeStore().validateAssignable(attrs, actor);
		expect(ensureMock).toHaveBeenCalledWith(attrs);
	});

	it('scopeRoomsPage is identity pass-through (no flag)', async () => {
		const rooms = [{ _id: 'r1', abacAttributes: [{ key: 'k', values: ['v'] }] }];
		const out = await new LocalAttributeStore().scopeRoomsPage(rooms, actor);
		expect(out).toEqual(rooms);
		expect(out[0]).not.toHaveProperty('abacAttributesRedacted');
	});

	it('assertCanModifyRoom is a no-op', async () => {
		await expect(new LocalAttributeStore().assertCanModifyRoom({ _id: 'r', abacAttributes: [] }, actor)).resolves.toBeUndefined();
	});

	// ABAC-P4/D12 — this used to return an empty map as an "everything allowed" sentinel, which
	// made "assign only attributes you possess" unenforceable for the local store. It now reports
	// the actor's own subject attributes.
	it('entitlementsOf reports the actor\'s own subject attributes', async () => {
		usersFindOneById.mockResolvedValue({
			_id: 'u',
			abacAttributes: [
				{ key: 'clearance', values: ['secret', 'top-secret'] },
				{ key: 'mission', values: ['alpha'] },
			],
		});

		const entitlements = await new LocalAttributeStore().entitlementsOf(actor);

		expect(usersFindOneById).toHaveBeenCalledWith('u', { projection: { abacAttributes: 1 } });
		expect(entitlements.get('clearance')).toEqual(new Set(['secret', 'top-secret']));
		expect(entitlements.get('mission')).toEqual(new Set(['alpha']));
		expect(entitlements.size).toBe(2);
	});

	it('entitlementsOf returns an empty map for an actor with no attributes', async () => {
		usersFindOneById.mockResolvedValue({ _id: 'u' });

		const entitlements = await new LocalAttributeStore().entitlementsOf(actor);

		expect(entitlements.size).toBe(0);
	});

	it('entitlementsOf returns an empty map when the actor cannot be found', async () => {
		usersFindOneById.mockResolvedValue(null);

		const entitlements = await new LocalAttributeStore().entitlementsOf(actor);

		expect(entitlements.size).toBe(0);
	});

	it('list queries AbacAttributes paginated (no filters)', async () => {
		const docs = [{ _id: 'id1', key: 'k', values: ['v'] }];
		findPaginated.mockReturnValue({ cursor: { toArray: async () => docs }, totalCount: Promise.resolve(1) });
		const r = await new LocalAttributeStore().list(actor, { offset: 0, count: 25 });
		expect(findPaginated).toHaveBeenCalledWith({}, { projection: { key: 1, values: 1 }, skip: 0, limit: 25 });
		expect(r).toEqual({ attributes: docs, offset: 0, count: 1, total: 1 });
	});

	it('list builds $or query when key and values filters provided', async () => {
		findPaginated.mockReturnValue({ cursor: { toArray: async () => [] }, totalCount: Promise.resolve(0) });
		await new LocalAttributeStore().list(actor, { key: 'foo', values: 'bar', offset: 5, count: 10 });
		expect(findPaginated).toHaveBeenCalledWith(
			{ $or: [{ key: /foo/i }, { values: /bar/i }] },
			{ projection: { key: 1, values: 1 }, skip: 5, limit: 10 },
		);
	});
});
