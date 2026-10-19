import type { AbacRoomMembershipPreviewPage } from '@rocket.chat/core-services';
import type { IAbacAttributeDefinition, IRoom, IUser } from '@rocket.chat/core-typings';
import type { Collection } from 'mongodb';

import { LOCAL_PREVIEW_PAGE_SIZE, LocalPDP } from './LocalPDP';
import { previewRetainingEveryone } from '../helper';
import { acquireSharedInMemoryMongo, type SharedMongoConnection } from '../test-helpers/mongoMemoryServer';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	LDAPEnterprise: { syncUsersAbacAttributesByIds: jest.fn() },
}));

let sharedMongo: SharedMongoConnection;
let usersCol: Collection<Pick<IUser, '_id' | 'username' | 'type' | 'roles' | 'active' | 'abacAttributes'>>;
let roomsCol: Collection<Pick<IRoom, '_id' | 't' | 'abacAttributes'>>;

const pdp = new LocalPDP();

const holderAttributes = [
	{ key: 'dept', values: ['eng', 'sales'] },
	{ key: 'region', values: ['emea'] },
];
const partialAttributes = [{ key: 'dept', values: ['eng'] }];

const subject = (_id: string, abacAttributes?: IAbacAttributeDefinition[]) => ({ _id, username: _id, abacAttributes });

const insertUser = (_id: string, abacAttributes?: IAbacAttributeDefinition[]) =>
	usersCol.insertOne({ _id, username: _id, type: 'user', roles: [], active: true, ...(abacAttributes && { abacAttributes }) });

beforeAll(async () => {
	sharedMongo = await acquireSharedInMemoryMongo('abac_local_pdp_test');
	usersCol = sharedMongo.db.collection('users');
	roomsCol = sharedMongo.db.collection('rocketchat_room');
});

afterAll(async () => {
	await sharedMongo.cleanupDatabase();
	await sharedMongo.release();
});

beforeEach(async () => {
	await usersCol.deleteMany({});
	await roomsCol.deleteMany({});
	await insertUser('holder', holderAttributes);
	await insertUser('partial', partialAttributes);
	await insertUser('none');
});

describe('LocalPDP.evaluateSubjectsAgainstAttributes', () => {
	const room = { _id: 'r1' };

	it('splits subjects into compliant and non-compliant, never inconclusive', async () => {
		const result = await pdp.evaluateSubjectsAgainstAttributes(
			[subject('holder'), subject('partial'), subject('none')],
			[{ key: 'dept', values: ['eng', 'sales'] }],
			room,
		);

		expect(result.compliant).toEqual(['holder']);
		expect(result.nonCompliant.sort()).toEqual(['none', 'partial']);
		expect(result.inconclusive).toEqual([]);
	});

	it('requires every attribute key', async () => {
		const result = await pdp.evaluateSubjectsAgainstAttributes(
			[subject('holder'), subject('partial')],
			[
				{ key: 'dept', values: ['eng'] },
				{ key: 'region', values: ['emea'] },
			],
			room,
		);

		expect(result).toEqual({ compliant: ['holder'], nonCompliant: ['partial'], inconclusive: [] });
	});

	it('treats every subject as compliant when there are no attributes', async () => {
		const result = await pdp.evaluateSubjectsAgainstAttributes([subject('none')], [], room);

		expect(result).toEqual({ compliant: ['none'], nonCompliant: [], inconclusive: [] });
	});

	it('agrees with checkUsernamesMatchAttributes', async () => {
		const attributes = [{ key: 'dept', values: ['eng'] }];
		const { compliant, nonCompliant } = await pdp.evaluateSubjectsAgainstAttributes(
			[subject('holder'), subject('partial'), subject('none')],
			attributes,
			room,
		);

		await Promise.all(
			compliant.map((id) => expect(pdp.checkUsernamesMatchAttributes([id], attributes, room as IRoom)).resolves.toBeUndefined()),
		);
		await Promise.all(
			nonCompliant.map((id) => expect(pdp.checkUsernamesMatchAttributes([id], attributes, room as IRoom)).rejects.toThrow()),
		);
	});
});

describe('LocalPDP.evaluateSubjectAgainstRooms', () => {
	const engRoom = { _id: 'eng', t: 'p' as const, abacAttributes: [{ key: 'dept', values: ['eng'] }] };
	const engEmeaRoom = {
		_id: 'eng-emea',
		t: 'p' as const,
		abacAttributes: [
			{ key: 'dept', values: ['eng'] },
			{ key: 'region', values: ['emea'] },
		],
	};
	const hrRoom = { _id: 'hr', t: 'p' as const, abacAttributes: [{ key: 'dept', values: ['hr'] }] };
	const plainRoom = { _id: 'plain', t: 'p' as const };

	beforeEach(async () => {
		await roomsCol.insertMany([engRoom, engEmeaRoom, hrRoom, plainRoom]);
	});

	it('splits the rooms into compliant and non-compliant in one pass, never inconclusive', async () => {
		const result = await pdp.evaluateSubjectAgainstRooms(subject('partial', partialAttributes), [engRoom, engEmeaRoom, hrRoom]);

		expect(result.compliant).toEqual(['eng']);
		expect(result.nonCompliant.sort()).toEqual(['eng-emea', 'hr']);
		expect(result.inconclusive).toEqual([]);
	});

	it('admits a subject holding every attribute of the room', async () => {
		const result = await pdp.evaluateSubjectAgainstRooms(subject('holder', holderAttributes), [engRoom, engEmeaRoom, hrRoom]);

		expect(result.compliant.sort()).toEqual(['eng', 'eng-emea']);
		expect(result.nonCompliant).toEqual(['hr']);
	});

	it('refuses every attributed room to a subject without attributes, and keeps a room without any', async () => {
		const result = await pdp.evaluateSubjectAgainstRooms(subject('none'), [engRoom, plainRoom]);

		expect(result).toEqual({ compliant: ['plain'], nonCompliant: ['eng'], inconclusive: [] });
	});

	it('refuses a room that does not exist', async () => {
		const result = await pdp.evaluateSubjectAgainstRooms(subject('holder', holderAttributes), [
			engRoom,
			{ _id: 'gone', abacAttributes: engRoom.abacAttributes },
		]);

		expect(result).toEqual({ compliant: ['eng'], nonCompliant: ['gone'], inconclusive: [] });
	});
});

describe('LocalPDP.assertCreatorMayAssign', () => {
	const requested = [
		{ key: 'dept', values: ['eng', 'sales'] },
		{ key: 'region', values: ['emea'] },
	];

	it('refuses the values the creator does not hold, naming only those', async () => {
		await expect(new LocalPDP(true).assertCreatorMayAssign(requested, { _id: 'partial' })).rejects.toMatchObject({
			code: 'error-invalid-attribute-values',
			details: {
				attributes: [
					{ key: 'dept', values: ['sales'] },
					{ key: 'region', values: ['emea'] },
				],
			},
		});
	});

	it('allows values the creator holds, without admitting them to the room', async () => {
		await expect(new LocalPDP(true).assertCreatorMayAssign(requested, { _id: 'holder' })).resolves.toEqual({ creatorAdmitted: false });
	});

	it('allows values the creator does not hold while restricting to owned attributes is off', async () => {
		await expect(new LocalPDP(false).assertCreatorMayAssign(requested, { _id: 'none' })).resolves.toEqual({ creatorAdmitted: false });
	});

	it('applies a changed restriction setting', async () => {
		const restricting = new LocalPDP(false);
		restricting.setRestrictToOwnedAttributes(true);

		await expect(restricting.assertCreatorMayAssign(requested, { _id: 'none' })).rejects.toMatchObject({
			code: 'error-invalid-attribute-values',
		});
	});
});

describe('LocalPDP.filterAssignableAttributes', () => {
	it('offers only the defined values the creator holds, leaving out keys they hold nothing of', async () => {
		const definitions = [
			{ key: 'dept', values: ['eng', 'sales', 'hr'] },
			{ key: 'region', values: ['emea', 'apac'] },
		];

		await expect(new LocalPDP(true).filterAssignableAttributes(definitions, { _id: 'partial' })).resolves.toEqual([
			{ key: 'dept', values: ['eng'] },
		]);
	});

	it('also offers the values already on the room', async () => {
		const definitions = [{ key: 'dept', values: ['eng', 'sales', 'hr'] }];

		await expect(
			new LocalPDP(true).filterAssignableAttributes(definitions, { _id: 'partial' }, [{ key: 'dept', values: ['hr'] }]),
		).resolves.toEqual([{ key: 'dept', values: ['eng', 'hr'] }]);
	});
});

describe('LocalPDP.findUnassignableValues', () => {
	it('keeps values already on the room assignable to an editor who does not hold them', async () => {
		await expect(
			new LocalPDP(true).findUnassignableValues([{ key: 'dept', values: ['eng', 'hr', 'sales'] }], { _id: 'partial' }, [
				{ key: 'dept', values: ['hr'] },
			]),
		).resolves.toEqual([{ key: 'dept', values: ['sales'] }]);
	});
});

describe('LocalPDP.previewRoomMembers', () => {
	const room = { _id: 'r1', abacAttributes: [] };
	const required = [{ key: 'dept', values: ['eng', 'sales'] }];
	const previewMembers = (page: AbacRoomMembershipPreviewPage) => pdp.previewRoomMembers(room, required, page);
	const ids = (preview: { members: { _id: string }[] }) => preview.members.map(({ _id }) => _id);
	const verdicts = (preview: { members: { _id: string; verdict: string }[] }) => preview.members.map(({ _id, verdict }) => [_id, verdict]);

	beforeEach(async () => {
		const members = sharedMongo.db.collection<Pick<IUser, '_id' | 'username' | 'name' | 'active' | '__rooms'>>('users');
		await members.updateMany({ _id: { $in: ['holder', 'partial', 'none'] } }, { $set: { __rooms: ['r1'] } });
		await members.updateOne({ _id: 'holder' }, { $set: { name: 'Ada Holder', __rooms: ['r1', 'r2'] } });
		await members.insertMany([
			{ _id: 'gone', username: 'gone', active: false, __rooms: ['r1'] },
			{ _id: 'outsider', username: 'outsider', active: true, __rooms: ['r3'] },
		]);
	});

	it('returns every active member of the room, each with its verdict, in username order', async () => {
		const preview = await previewMembers({});

		expect(verdicts(preview)).toEqual([
			['holder', 'compliant'],
			['none', 'nonCompliant'],
			['partial', 'nonCompliant'],
		]);
		expect(preview).toMatchObject({ checked: 3, total: 3 });
		expect(preview).not.toHaveProperty('next');
	});

	it('lists the members after an exclusive cursor', async () => {
		const first = await previewMembers({});
		const second = await previewMembers({ after: { _id: 'holder', username: 'holder' } });

		expect(ids(first)).toEqual(['holder', 'none', 'partial']);
		expect(ids(second)).toEqual(['none', 'partial']);
		expect(second.checked).toBe(2);
		expect(second).not.toHaveProperty('total');
	});

	it('returns each group alone, with every member of the room counted as checked', async () => {
		const loses = await previewMembers({ group: 'loses' });
		const retains = await previewMembers({ group: 'retains' });

		expect(verdicts(loses)).toEqual([
			['none', 'nonCompliant'],
			['partial', 'nonCompliant'],
		]);
		expect(verdicts(retains)).toEqual([['holder', 'compliant']]);
		expect(loses).toEqual(expect.objectContaining({ checked: 3, total: 3 }));
		expect(retains).toEqual(expect.objectContaining({ checked: 3, total: 3 }));
		expect(loses).not.toHaveProperty('next');
	});

	describe('beyond one page', () => {
		const extra = Array.from({ length: LOCAL_PREVIEW_PAGE_SIZE }, (_, index) => `z${String(index).padStart(4, '0')}`);

		beforeEach(async () => {
			await sharedMongo.db
				.collection<Pick<IUser, '_id' | 'username' | 'active' | '__rooms'>>('users')
				.insertMany(extra.map((_id) => ({ _id, username: _id, active: true, __rooms: ['r1'] })));
		});

		it('fills a page with the group, points next at its last member, and counts checked up to it', async () => {
			const first = await previewMembers({ group: 'loses' });
			const rest = await previewMembers({ group: 'loses', after: first.next });
			const lastReturned = extra[LOCAL_PREVIEW_PAGE_SIZE - 3];

			expect(first.members).toHaveLength(LOCAL_PREVIEW_PAGE_SIZE);
			expect(first).toMatchObject({ checked: LOCAL_PREVIEW_PAGE_SIZE + 1, total: LOCAL_PREVIEW_PAGE_SIZE + 3 });
			expect(first.next).toEqual({ _id: lastReturned, username: lastReturned });
			expect(ids(rest)).toEqual(extra.slice(-2));
			expect(rest.checked).toBe(2);
			expect(rest).not.toHaveProperty('total');
			expect(rest).not.toHaveProperty('next');
		});

		it('returns a sparse group from the whole room in one page', async () => {
			const retains = await previewMembers({ group: 'retains' });

			expect(verdicts(retains)).toEqual([['holder', 'compliant']]);
			expect(retains).toMatchObject({ checked: LOCAL_PREVIEW_PAGE_SIZE + 3, total: LOCAL_PREVIEW_PAGE_SIZE + 3 });
			expect(retains).not.toHaveProperty('next');
		});

		it('pages ungrouped members a full page at a time, pointing next at the last member read', async () => {
			const first = await previewMembers({});
			const lastRead = extra[LOCAL_PREVIEW_PAGE_SIZE - 4];

			expect(first.members).toHaveLength(LOCAL_PREVIEW_PAGE_SIZE);
			expect(first).toMatchObject({ checked: LOCAL_PREVIEW_PAGE_SIZE, next: { _id: lastRead } });
		});
	});

	it('searches username and name, literally, in either group', async () => {
		const byName = await previewMembers({ filter: 'ada', group: 'retains' });
		const losingByName = await previewMembers({ filter: 'ada', group: 'loses' });
		const pattern = await previewMembers({ filter: '.*', group: 'loses' });

		expect(ids(byName)).toEqual(['holder']);
		expect(byName).toMatchObject({ checked: 1, total: 1 });
		expect(losingByName).toEqual({ members: [], checked: 1, total: 1 });
		expect(pattern.members).toEqual([]);
	});

	it('retains everyone when there is nothing to evaluate against', async () => {
		const retains = await previewRetainingEveryone(room._id, { count: 10 });
		const loses = await previewRetainingEveryone(room._id, { count: 10, group: 'loses' });

		expect(verdicts(retains)).toEqual([
			['holder', 'compliant'],
			['none', 'compliant'],
			['partial', 'compliant'],
		]);
		expect(loses).toEqual({ members: [], checked: 3, total: 3 });
	});
});

describe('LocalPDP.needsEvaluation', () => {
	it('evaluates a change that adds a value, since every key and value is required', () => {
		expect(pdp.needsEvaluation({ added: true, removed: false })).toBe(true);
		expect(pdp.needsEvaluation({ added: true, removed: true })).toBe(true);
	});

	it('skips a change that only removes, since that can only widen access', () => {
		expect(pdp.needsEvaluation({ added: false, removed: true })).toBe(false);
		expect(pdp.needsEvaluation({ added: false, removed: false })).toBe(false);
	});
});
