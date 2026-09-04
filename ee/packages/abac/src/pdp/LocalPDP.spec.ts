import { LocalPDP } from './LocalPDP';

const usersFind = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Users: {
		find: (...a: unknown[]) => usersFind(...a),
		findOne: jest.fn(),
		findOneById: jest.fn(),
	},
	Rooms: {
		find: jest.fn(),
	},
}));

jest.mock('@rocket.chat/core-services', () => ({
	LDAPEnterprise: { syncUsersAbacAttributesByIds: jest.fn() },
	// `errors.ts` extends MeteorError at module load, so the mock has to supply a real class.
	MeteorError: class MeteorError extends Error {},
	isMeteorError: () => false,
}));

/** Mirrors the cursor shape LocalPDP consumes: `.map(fn).toArray()`. */
const cursor = <T>(items: T[]) => ({
	map: <R>(fn: (item: T) => R) => ({ toArray: () => Promise.resolve(items.map(fn)) }),
	toArray: () => Promise.resolve(items),
});

const subject = (_id: string) => ({ _id, username: _id, emails: [{ address: `${_id}@x.com`, verified: true }] });

beforeEach(() => {
	usersFind.mockReset();
});

describe('LocalPDP.evaluateSubjectsAgainstAttributes (ABAC-P4 §7.2)', () => {
	const attrs = [{ key: 'clearance', values: ['secret'] }];

	it('returns everyone compliant and queries nothing when there are no attributes', async () => {
		const result = await new LocalPDP().evaluateSubjectsAgainstAttributes([subject('u1'), subject('u2')], [], 'r1');

		expect(result).toEqual({ compliantUserIds: ['u1', 'u2'], nonCompliantUserIds: [], inconclusiveUserIds: [] });
		// `buildNonCompliantConditions([])` is `[]`, and `$or: []` is not a legal query — the guard
		// exists so this path never reaches Mongo.
		expect(usersFind).not.toHaveBeenCalled();
	});

	it('returns empty partitions and queries nothing when there are no subjects', async () => {
		const result = await new LocalPDP().evaluateSubjectsAgainstAttributes([], attrs, 'r1');

		expect(result).toEqual({ compliantUserIds: [], nonCompliantUserIds: [], inconclusiveUserIds: [] });
		expect(usersFind).not.toHaveBeenCalled();
	});

	it('partitions on the non-compliance query, in one query', async () => {
		usersFind.mockReturnValue(cursor([{ _id: 'u2' }]));

		const result = await new LocalPDP().evaluateSubjectsAgainstAttributes([subject('u1'), subject('u2'), subject('u3')], attrs, 'r1');

		expect(result.nonCompliantUserIds).toEqual(['u2']);
		expect(result.compliantUserIds).toEqual(['u1', 'u3']);
		expect(usersFind).toHaveBeenCalledTimes(1);
	});

	it('reports everyone compliant when the query matches nobody', async () => {
		usersFind.mockReturnValue(cursor([]));

		const result = await new LocalPDP().evaluateSubjectsAgainstAttributes([subject('u1'), subject('u2')], attrs, 'r1');

		expect(result.compliantUserIds).toEqual(['u1', 'u2']);
		expect(result.nonCompliantUserIds).toEqual([]);
	});

	it('reports everyone non-compliant when the query matches all of them', async () => {
		usersFind.mockReturnValue(cursor([{ _id: 'u1' }, { _id: 'u2' }]));

		const result = await new LocalPDP().evaluateSubjectsAgainstAttributes([subject('u1'), subject('u2')], attrs, 'r1');

		expect(result.compliantUserIds).toEqual([]);
		expect(result.nonCompliantUserIds).toEqual(['u1', 'u2']);
	});

	it('never reports an inconclusive decision — a database query always answers', async () => {
		usersFind.mockReturnValue(cursor([{ _id: 'u1' }]));

		const result = await new LocalPDP().evaluateSubjectsAgainstAttributes([subject('u1'), subject('u2')], attrs, 'r1');

		expect(result.inconclusiveUserIds).toEqual([]);
	});

	it('scopes the query to the subjects it was given', async () => {
		usersFind.mockReturnValue(cursor([]));

		await new LocalPDP().evaluateSubjectsAgainstAttributes([subject('u1'), subject('u2')], attrs, 'r1');

		const [query] = usersFind.mock.calls[0];
		expect(query._id).toEqual({ $in: ['u1', 'u2'] });
		expect(query.$or).toHaveLength(1);
	});
});
