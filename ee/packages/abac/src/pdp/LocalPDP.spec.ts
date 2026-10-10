import type { IAbacAttributeDefinition, IRoom, IUser } from '@rocket.chat/core-typings';
import type { Collection } from 'mongodb';

import { LocalPDP } from './LocalPDP';
import { PREVIEW_SCAN_LIMIT } from '../helper';
import { acquireSharedInMemoryMongo, type SharedMongoConnection } from '../test-helpers/mongoMemoryServer';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	LDAPEnterprise: { syncUsersAbacAttributesByIds: jest.fn() },
}));

let sharedMongo: SharedMongoConnection;
let usersCol: Collection<Pick<IUser, '_id' | 'username' | 'type' | 'roles' | 'active' | 'abacAttributes'>>;
let roomsCol: Collection<Pick<IRoom, '_id' | 't' | 'abacAttributes'>>;

const pdp = new LocalPDP();

const subject = (_id: string) => ({ _id, username: _id });

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
	await insertUser('holder', [
		{ key: 'dept', values: ['eng', 'sales'] },
		{ key: 'region', values: ['emea'] },
	]);
	await insertUser('partial', [{ key: 'dept', values: ['eng'] }]);
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
		const result = await pdp.evaluateSubjectAgainstRooms(subject('partial'), [engRoom, engEmeaRoom, hrRoom]);

		expect(result.compliant).toEqual(['eng']);
		expect(result.nonCompliant.sort()).toEqual(['eng-emea', 'hr']);
		expect(result.inconclusive).toEqual([]);
	});

	it('admits a subject holding every attribute of the room', async () => {
		const result = await pdp.evaluateSubjectAgainstRooms(subject('holder'), [engRoom, engEmeaRoom, hrRoom]);

		expect(result.compliant.sort()).toEqual(['eng', 'eng-emea']);
		expect(result.nonCompliant).toEqual(['hr']);
	});

	it('refuses every attributed room to a subject without attributes, and keeps a room without any', async () => {
		const result = await pdp.evaluateSubjectAgainstRooms(subject('none'), [engRoom, plainRoom]);

		expect(result).toEqual({ compliant: ['plain'], nonCompliant: ['eng'], inconclusive: [] });
	});

	it('refuses every room to a subject that does not exist', async () => {
		const result = await pdp.evaluateSubjectAgainstRooms(subject('ghost'), [engRoom, plainRoom]);

		expect(result).toEqual({ compliant: [], nonCompliant: ['eng', 'plain'], inconclusive: [] });
	});

	it('refuses a room that does not exist', async () => {
		const result = await pdp.evaluateSubjectAgainstRooms(subject('holder'), [
			engRoom,
			{ _id: 'gone', abacAttributes: engRoom.abacAttributes },
		]);

		expect(result).toEqual({ compliant: ['eng'], nonCompliant: ['gone'], inconclusive: [] });
	});
});

describe('LocalPDP.previewRoomMembers', () => {
	const room = { _id: 'r1', abacAttributes: [] };
	const required = [{ key: 'dept', values: ['eng', 'sales'] }];
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
		const preview = await pdp.previewRoomMembers(room, required, { count: 10 });

		expect(verdicts(preview)).toEqual([
			['holder', 'compliant'],
			['none', 'nonCompliant'],
			['partial', 'nonCompliant'],
		]);
		expect(preview).not.toHaveProperty('next');
	});

	it('pages by the last member checked', async () => {
		const first = await pdp.previewRoomMembers(room, required, { count: 2 });
		const second = await pdp.previewRoomMembers(room, required, { count: 2, after: first.next });

		expect(first.members.map(({ _id }) => _id)).toEqual(['holder', 'none']);
		expect(first).toMatchObject({ checked: 2, total: 3, next: { _id: 'none', username: 'none' } });
		expect(second.members.map(({ _id }) => _id)).toEqual(['partial']);
		expect(second.checked).toBe(1);
		expect(second).not.toHaveProperty('total');
		expect(second).not.toHaveProperty('next');
	});

	it('returns every member of the losing group among the members it checked, even past the count asked for', async () => {
		const preview = await pdp.previewRoomMembers(room, required, { count: 1, group: 'loses' });

		expect(verdicts(preview)).toEqual([
			['none', 'nonCompliant'],
			['partial', 'nonCompliant'],
		]);
		expect(preview).toEqual(expect.objectContaining({ checked: 3, total: 3 }));
		expect(preview).not.toHaveProperty('next');
	});

	it('checks no more than the scan limit in one request, and points next at the last member checked', async () => {
		const extra = Array.from({ length: PREVIEW_SCAN_LIMIT }, (_, index) => `z${String(index).padStart(4, '0')}`);
		await sharedMongo.db
			.collection<Pick<IUser, '_id' | 'username' | 'active' | '__rooms'>>('users')
			.insertMany(extra.map((_id) => ({ _id, username: _id, active: true, __rooms: ['r1'] })));
		const lastChecked = extra[PREVIEW_SCAN_LIMIT - 4];

		const retains = await pdp.previewRoomMembers(room, required, { count: 1, group: 'retains' });
		const loses = await pdp.previewRoomMembers(room, required, { count: 1, group: 'loses' });
		const rest = await pdp.previewRoomMembers(room, required, { count: 1, group: 'loses', after: loses.next });

		expect(verdicts(retains)).toEqual([['holder', 'compliant']]);
		expect(retains).toMatchObject({ checked: PREVIEW_SCAN_LIMIT, total: PREVIEW_SCAN_LIMIT + 3, next: { _id: lastChecked } });
		expect(loses.members).toHaveLength(PREVIEW_SCAN_LIMIT - 1);
		expect(loses).toMatchObject({ checked: PREVIEW_SCAN_LIMIT, next: { _id: lastChecked } });
		expect(rest.members.map(({ _id }) => _id)).toEqual(extra.slice(-3));
		expect(rest.checked).toBe(3);
		expect(rest).not.toHaveProperty('next');
	});

	it('returns the retaining group alone', async () => {
		const preview = await pdp.previewRoomMembers(room, required, { count: 10, group: 'retains' });

		expect(verdicts(preview)).toEqual([['holder', 'compliant']]);
	});

	it('searches username and name, literally', async () => {
		const byName = await pdp.previewRoomMembers(room, required, { count: 10, filter: 'ada' });
		const pattern = await pdp.previewRoomMembers(room, required, { count: 10, filter: '.*' });

		expect(byName.members.map(({ _id }) => _id)).toEqual(['holder']);
		expect(byName.total).toBe(1);
		expect(pattern.members).toEqual([]);
	});

	it('retains everyone when there is nothing to evaluate against', async () => {
		const retains = await pdp.previewRoomMembers(room, [], { count: 10 });
		const loses = await pdp.previewRoomMembers(room, [], { count: 10, group: 'loses' });

		expect(retains.members.every(({ verdict }) => verdict === 'compliant')).toBe(true);
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
