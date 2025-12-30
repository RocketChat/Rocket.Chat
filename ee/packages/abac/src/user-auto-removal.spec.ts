import type { IAbacAttributeDefinition, IRoom, IUser } from '@rocket.chat/core-typings';
import {
	registerModel,
	Subscriptions,
	SubscriptionsRaw,
	UsersRaw,
	RoomsRaw,
	AbacAttributesRaw,
	ServerEventsRaw,
} from '@rocket.chat/models';
import type { Collection, Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { Audit } from './audit';
import { AbacService } from './index';

jest.mock('@rocket.chat/core-services', () => ({
	ServiceClass: class {},
	Room: {
		// Mimic the DB side-effects of removing a user from a room (no apps/system messages)
		removeUserFromRoom: async (roomId: string, user: any) => {
			await Subscriptions.removeByRoomIdAndUserId(roomId, user._id);
		},
	},
}));

describe('AbacService integration (onRoomAttributesChanged)', () => {
	let mongo: MongoMemoryServer;
	let client: MongoClient;
	let db: Db;
	let service: AbacService;

	let roomsCol: Collection<IRoom>;
	let usersCol: Collection<IUser>;

	const fakeActor = { _id: 'test-user', username: 'testuser', type: 'user' };

	const insertDefinitions = async (defs: { key: string; values: string[] }[]) => {
		const svc = new AbacService();
		await Promise.all(
			defs.map((def) =>
				svc.addAbacAttribute({ key: def.key, values: def.values }, fakeActor).catch((e: any) => {
					if (e instanceof Error && e.message === 'error-duplicate-attribute-key') {
						return;
					}
					throw e;
				}),
			),
		);
	};

	const insertRoom = async (abacAttributes: IAbacAttributeDefinition[] = []) => {
		const rid = `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
		await roomsCol.insertOne({
			_id: rid,
			t: 'p',
			name: `Test Room ${rid}`,
			abacAttributes,
		} as any);
		return rid;
	};

	const insertUsers = async (
		users: Array<{
			_id: string;
			abacAttributes?: IAbacAttributeDefinition[];
			member?: boolean;
			extraRooms?: string[];
		}>,
	) => {
		await usersCol.insertMany(
			users.map((u) => ({
				_id: u._id,
				username: u._id,
				type: 'user',
				roles: [],
				active: true,
				createdAt: new Date(),
				_updatedAt: new Date(),
				abacAttributes: u.abacAttributes,
				__rooms: u.extraRooms || [],
			})),
		);
	};

	let debugSpy: jest.SpyInstance;
	let auditSpy: jest.SpyInstance;

	beforeAll(async () => {
		mongo = await MongoMemoryServer.create();
		client = await MongoClient.connect(mongo.getUri(), {});
		db = client.db('abac_integration');

		// Register only the models we actually need for these tests
		registerModel('IUsersModel', () => new UsersRaw(db));
		registerModel('IRoomsModel', () => new RoomsRaw(db));
		registerModel('IAbacAttributesModel', () => new AbacAttributesRaw(db));
		registerModel('IServerEventsModel', () => new ServerEventsRaw(db));
		registerModel('ISubscriptionsModel', () => new SubscriptionsRaw(db));

		service = new AbacService();
		debugSpy = jest.spyOn((service as any).logger, 'debug').mockImplementation(() => undefined);
		auditSpy = jest.spyOn(Audit, 'actionPerformed').mockResolvedValue();

		roomsCol = db.collection<IRoom>('rocketchat_room');
		usersCol = db.collection<IUser>('users');
	}, 30_000);

	afterAll(async () => {
		await client.close();
		await mongo.stop();
	});

	beforeEach(async () => {
		debugSpy.mockClear();
		auditSpy.mockClear();
	});

	describe('setRoomAbacAttributes - new key addition', () => {
		let rid1: string;
		let rid2: string;

		beforeAll(async () => {
			rid1 = await insertRoom([]);
			await Promise.all([
				insertDefinitions([{ key: 'dept', values: ['eng', 'sales', 'hr'] }]),
				insertUsers([
					{ _id: 'u1_newkey', member: true, extraRooms: [rid1], abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] }, // compliant
					{ _id: 'u2_newkey', member: true, extraRooms: [rid1], abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // missing sales
					{ _id: 'u3_newkey', member: true, extraRooms: [rid1], abacAttributes: [{ key: 'location', values: ['emea'] }] }, // missing dept key
					{ _id: 'u4_newkey', member: true, extraRooms: [rid1], abacAttributes: [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] }, // superset
					{ _id: 'u5_newkey', member: false, abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] }, // not in room
				]),
			]);

			rid2 = await insertRoom([]);

			await Promise.all([
				insertDefinitions([{ key: 'dep2t', values: ['eng', 'sales'] }]),
				insertUsers([
					{ _id: 'u1_dupvals', member: true, extraRooms: [rid2], abacAttributes: [{ key: 'dep2t', values: ['eng', 'sales'] }] },
					{ _id: 'u2_dupvals', member: true, extraRooms: [rid2], abacAttributes: [{ key: 'dep2t', values: ['eng'] }] }, // non compliant (missing sales)
				]),
			]);
		}, 30_000);

		beforeEach(() => {
			auditSpy.mockReset();
		});
		it('logs users that do not satisfy newly added attribute key or its values and actually removes them', async () => {
			const changeSpy = jest.spyOn<any, any>(service as any, 'onRoomAttributesChanged');

			await service.setRoomAbacAttributes(rid1, { dept: ['eng', 'sales'] }, fakeActor);

			expect(changeSpy).toHaveBeenCalledTimes(1);
			expect(changeSpy.mock.calls[0][0]).toMatchObject({ _id: rid1 });
			expect(Array.isArray((changeSpy as any).mock.calls[0][0].abacAttributes)).toBe(true);

			expect(auditSpy).toHaveBeenCalledTimes(2);
			const auditedUsers = auditSpy.mock.calls.map((call) => call[0]._id).sort();
			const auditedRooms = new Set(auditSpy.mock.calls.map((call) => call[1]._id));
			const auditedActions = new Set(auditSpy.mock.calls.map((call) => call[2]));
			expect(auditedUsers).toEqual(['u2_newkey', 'u3_newkey']);
			expect(auditedRooms).toEqual(new Set([rid1]));
			expect(auditedActions).toEqual(new Set(['room-attributes-change']));
		});

		it('handles duplicate values in room attributes equivalently to unique set (logs non compliant and removes them)', async () => {
			await service.setRoomAbacAttributes(rid2, { dep2t: ['eng', 'eng', 'sales'] }, fakeActor);

			expect(auditSpy).toHaveBeenCalledTimes(1);

			expect(auditSpy.mock.calls[0][0]).toMatchObject({ _id: 'u2_dupvals', username: 'u2_dupvals' });
			expect(auditSpy.mock.calls[0][1]).toMatchObject({ _id: rid2 });
			expect(auditSpy.mock.calls[0][2]).toBe('room-attributes-change');

			const u1 = await usersCol.findOne({ _id: 'u1_dupvals' }, { projection: { __rooms: 1 } });
			const u2 = await usersCol.findOne({ _id: 'u2_dupvals' }, { projection: { __rooms: 1 } });
			expect(u1?.__rooms || []).toContain(rid2);
			expect(u2?.__rooms || []).not.toContain(rid2);
		});
	});

	describe('updateRoomAbacAttributeValues - new value addition', () => {
		let rid: string;

		beforeAll(async () => {
			rid = await insertRoom([{ key: 'dept', values: ['eng'] }]);

			await Promise.all([
				insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]),
				insertUsers([
					{ _id: 'u1_newval', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] }, // already superset
					{ _id: 'u2_newval', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // missing new value
					{ _id: 'u3_newval', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] }, // superset
				]),
			]);
		}, 30_000);

		it('logs users missing newly added value while retaining compliant ones and removes the missing ones', async () => {
			await service.updateRoomAbacAttributeValues(rid, 'dept', ['eng', 'sales'], fakeActor);

			expect(auditSpy).toHaveBeenCalledTimes(1);
			expect(auditSpy.mock.calls[0][0]).toMatchObject({ _id: 'u2_newval', username: 'u2_newval' });
			expect(auditSpy.mock.calls[0][1]).toMatchObject({ _id: rid });
			expect(auditSpy.mock.calls[0][2]).toBe('room-attributes-change');
		});

		it('produces no evaluation log when only removing values from existing attribute', async () => {
			const rid = await insertRoom([{ key: 'dept', values: ['eng', 'sales'] }]);

			await Promise.all([
				insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]),
				insertUsers([
					{ _id: 'u1_rmval', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng'] }] },
					{ _id: 'u2_rmval', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] },
				]),
			]);

			await service.updateRoomAbacAttributeValues(rid, 'dept', ['eng'], fakeActor); // removal only

			expect(auditSpy).not.toHaveBeenCalled();

			// nobody removed because removal only does not trigger reevaluation
			const u1 = await usersCol.findOne({ _id: 'u1_rmval' }, { projection: { __rooms: 1 } });
			const u2 = await usersCol.findOne({ _id: 'u2_rmval' }, { projection: { __rooms: 1 } });
			expect(u1?.__rooms || []).toContain(rid);
			expect(u2?.__rooms || []).toContain(rid);
		});
	});

	describe('setRoomAbacAttributes - multi-attribute addition', () => {
		let rid: string;

		beforeAll(async () => {
			rid = await insertRoom([{ key: 'dept', values: ['eng'] }]);

			await Promise.all([
				insertDefinitions([
					{ key: 'dept', values: ['eng', 'sales', 'hr'] },
					{ key: 'region', values: ['emea', 'apac'] },
				]),
				insertUsers([
					{
						_id: 'u1_multi',
						member: true,
						extraRooms: [rid],
						abacAttributes: [
							{ key: 'dept', values: ['eng', 'sales'] },
							{ key: 'region', values: ['emea'] },
						],
					}, // compliant after expansion
					{
						_id: 'u2_multi',
						member: true,
						extraRooms: [rid],
						abacAttributes: [{ key: 'dept', values: ['eng'] }], // missing region
					},
					{
						_id: 'u3_multi',
						member: true,
						extraRooms: [rid],
						abacAttributes: [{ key: 'region', values: ['emea'] }], // missing dept key
					},
					{
						_id: 'u4_multi',
						member: true,
						extraRooms: [rid],
						abacAttributes: [
							{ key: 'dept', values: ['eng', 'sales', 'hr'] },
							{ key: 'region', values: ['emea', 'apac'] },
						],
					}, // superset across both
					{
						_id: 'u5_multi',
						member: true,
						extraRooms: [rid],
						abacAttributes: [
							{ key: 'dept', values: ['eng', 'sales'] },
							{ key: 'region', values: ['apac'] },
						],
					},
				]),
			]);
		}, 30_000);

		it('enforces all attributes (AND semantics) removing users failing any', async () => {
			await service.setRoomAbacAttributes(
				rid,
				{
					dept: ['eng', 'sales'],
					region: ['emea'],
				},
				fakeActor,
			);

			expect(auditSpy).toHaveBeenCalledTimes(3);
			const auditedUsers = auditSpy.mock.calls.map((call) => call[0]._id).sort();
			expect(auditedUsers).toEqual(['u2_multi', 'u3_multi', 'u5_multi']);
			const auditedRooms = new Set(auditSpy.mock.calls.map((call) => call[1]._id));
			expect(auditedRooms).toEqual(new Set([rid]));
			const auditedActions = new Set(auditSpy.mock.calls.map((call) => call[2]));
			expect(auditedActions).toEqual(new Set(['room-attributes-change']));
		});
	});

	describe('Idempotency & no-op behavior', () => {
		let rid: string;

		beforeAll(async () => {
			rid = await insertRoom([]);

			await Promise.all([
				insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]),
				insertUsers([
					{ _id: 'u1_idem', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] },
					{ _id: 'u2_idem', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // will be removed on first pass
				]),
			]);
		}, 30_000);

		it('does not remove anyone when calling with identical attribute set twice', async () => {
			await service.setRoomAbacAttributes(rid, { dept: ['eng', 'sales'] }, fakeActor);
			expect(auditSpy).toHaveBeenCalledTimes(1);
			expect(auditSpy.mock.calls[0][0]).toMatchObject({ _id: 'u2_idem', username: 'u2_idem' });
			expect(auditSpy.mock.calls[0][1]).toMatchObject({ _id: rid });
			expect(auditSpy.mock.calls[0][2]).toBe('room-attributes-change');

			let u1 = await usersCol.findOne({ _id: 'u1_idem' }, { projection: { __rooms: 1 } });
			let u2 = await usersCol.findOne({ _id: 'u2_idem' }, { projection: { __rooms: 1 } });
			expect(u1?.__rooms || []).toContain(rid);
			expect(u2?.__rooms || []).not.toContain(rid);

			// Reset mock counts for clarity
			debugSpy.mockClear();
			auditSpy.mockClear();

			await service.setRoomAbacAttributes(rid, { dept: ['eng', 'sales'] }, fakeActor);
			expect(auditSpy).not.toHaveBeenCalled();

			u1 = await usersCol.findOne({ _id: 'u1_idem' }, { projection: { __rooms: 1 } });
			u2 = await usersCol.findOne({ _id: 'u2_idem' }, { projection: { __rooms: 1 } });
			expect(u1?.__rooms || []).toContain(rid);
			expect(u2?.__rooms || []).not.toContain(rid);
		});
	});

	describe('Superset and missing attribute edge cases', () => {
		let ridSuperset: string;
		let ridMissingKey: string;

		beforeAll(async () => {
			ridSuperset = await insertRoom([]);

			await Promise.all([
				insertDefinitions([{ key: 'dept', values: ['eng', 'sales', 'hr'] }]),
				insertUsers([
					{
						_id: 'u1_superset',
						member: true,
						extraRooms: [ridSuperset],
						abacAttributes: [{ key: 'dept', values: ['eng', 'sales', 'hr'] }],
					},
					{ _id: 'u2_superset', member: true, extraRooms: [ridSuperset], abacAttributes: [{ key: 'dept', values: ['eng', 'hr'] }] }, // missing sales
				]),
			]);

			ridMissingKey = await insertRoom([]);

			await Promise.all([
				insertDefinitions([{ key: 'region', values: ['emea', 'apac'] }]),
				insertUsers([
					{ _id: 'u1_misskey', member: true, extraRooms: [ridMissingKey], abacAttributes: [{ key: 'region', values: ['emea'] }] },
					{ _id: 'u2_misskey', member: true, extraRooms: [ridMissingKey], abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // missing region
					{ _id: 'u3_misskey', member: true, extraRooms: [ridMissingKey] }, // no abacAttributes field
				]),
			]);
		}, 30_000);

		it('keeps user with superset values and removes user missing one required value', async () => {
			await service.setRoomAbacAttributes(ridSuperset, { dept: ['eng', 'sales', 'hr'] }, fakeActor);

			expect(auditSpy).toHaveBeenCalledTimes(1);
			expect(auditSpy.mock.calls[0][0]).toMatchObject({ _id: 'u2_superset', username: 'u2_superset' });
			expect(auditSpy.mock.calls[0][1]).toMatchObject({ _id: ridSuperset });
			expect(auditSpy.mock.calls[0][2]).toBe('room-attributes-change');

			const u1 = await usersCol.findOne({ _id: 'u1_superset' }, { projection: { __rooms: 1 } });
			const u2 = await usersCol.findOne({ _id: 'u2_superset' }, { projection: { __rooms: 1 } });
			expect(u1?.__rooms || []).toContain(ridSuperset);
			expect(u2?.__rooms || []).not.toContain(ridSuperset);
		});

		it('removes user missing attribute key entirely', async () => {
			await service.setRoomAbacAttributes(ridMissingKey, { region: ['emea'] }, fakeActor);

			expect(auditSpy).toHaveBeenCalledTimes(2);
			const auditedUsers = auditSpy.mock.calls.map((call) => call[0]._id).sort();
			expect(auditedUsers).toEqual(['u2_misskey', 'u3_misskey']);
			const auditedRooms = new Set(auditSpy.mock.calls.map((call) => call[1]._id));
			expect(auditedRooms).toEqual(new Set([ridMissingKey]));
			const auditedActions = new Set(auditSpy.mock.calls.map((call) => call[2]));
			expect(auditedActions).toEqual(new Set(['room-attributes-change']));
		});
	});

	describe('Large member set performance sanity (lightweight)', () => {
		let rid: string;

		beforeAll(async () => {
			rid = await insertRoom([]);

			await Promise.all([insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }])]);

			const bulk: Parameters<typeof insertUsers>[0] = [];
			for (let i = 0; i < 300; i++) {
				// Half compliant with both values, half only 'eng'
				const values = i % 2 === 0 ? ['eng', 'sales'] : ['eng'];
				bulk.push({
					_id: `u${i}`,
					member: true,
					extraRooms: [rid],
					abacAttributes: [{ key: 'dept', values }],
				});
			}
			await insertUsers(bulk);
		}, 30_000);

		it('removes only expected fraction in a larger population', async () => {
			await service.setRoomAbacAttributes(rid, { dept: ['eng', 'sales'] }, fakeActor);

			expect(auditSpy).toHaveBeenCalledTimes(150);
			const removed = auditSpy.mock.calls.map((call) => call[0]._id);
			expect(removed.length).toBe(150);
			expect(removed).toContain('u1');
			expect(removed).toContain('u299');
			expect(removed).not.toContain('u0');
			expect(removed).not.toContain('u298');

			const auditedRooms = new Set(auditSpy.mock.calls.map((call) => call[1]._id));
			expect(auditedRooms).toEqual(new Set([rid]));
			const auditedActions = new Set(auditSpy.mock.calls.map((call) => call[2]));
			expect(auditedActions).toEqual(new Set(['room-attributes-change']));
		});
	});
});
