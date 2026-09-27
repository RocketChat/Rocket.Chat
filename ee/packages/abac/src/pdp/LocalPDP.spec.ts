import type { IAbacAttributeDefinition, IRoom, IUser } from '@rocket.chat/core-typings';
import type { Collection } from 'mongodb';

import { LocalPDP } from './LocalPDP';
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
