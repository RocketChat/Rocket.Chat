import type { IAbacAttributeDefinition, IRoom, IUser } from '@rocket.chat/core-typings';
import { registerServiceModels } from '@rocket.chat/models';
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
			const { Subscriptions } = await import('@rocket.chat/models');
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

		// Hack to register the models in here with a custom database without having to call every model by one
		registerServiceModels(db as any);

		// @ts-expect-error - ignore
		await db.collection('abac_dummy_init').insertOne({ _id: 'init', createdAt: new Date() });

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
		it('logs users that do not satisfy newly added attribute key or its values and actually removes them', async () => {
			const rid = await insertRoom([]);

			await Promise.all([
				insertDefinitions([{ key: 'dept', values: ['eng', 'sales', 'hr'] }]),
				insertUsers([
					{ _id: 'u1_newkey', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] }, // compliant
					{ _id: 'u2_newkey', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // missing sales
					{ _id: 'u3_newkey', member: true, extraRooms: [rid], abacAttributes: [{ key: 'location', values: ['emea'] }] }, // missing dept key
					{ _id: 'u4_newkey', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] }, // superset
					{ _id: 'u5_newkey', member: false, abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] }, // not in room
				]),
			]);

			const changeSpy = jest.spyOn<any, any>(service as any, 'onRoomAttributesChanged');

			await service.setRoomAbacAttributes(rid, { dept: ['eng', 'sales'] }, fakeActor);

			expect(changeSpy).toHaveBeenCalledTimes(1);
			expect(changeSpy.mock.calls[0][0]).toMatchObject({ _id: rid });
			expect(Array.isArray((changeSpy as any).mock.calls[0][0].abacAttributes)).toBe(true);

			expect(auditSpy).toHaveBeenCalledTimes(2);
			const auditedUsers = auditSpy.mock.calls.map((call) => call[0]._id).sort();
			const auditedRooms = new Set(auditSpy.mock.calls.map((call) => call[1]._id));
			const auditedActions = new Set(auditSpy.mock.calls.map((call) => call[2]));
			expect(auditedUsers).toEqual(['u2_newkey', 'u3_newkey']);
			expect(auditedRooms).toEqual(new Set([rid]));
			expect(auditedActions).toEqual(new Set(['room-attributes-change']));

			const remaining = await usersCol
				.find({ _id: { $in: ['u1_newkey', 'u2_newkey', 'u3_newkey', 'u4_newkey'] } }, { projection: { __rooms: 1 } })
				.toArray()
				.then((docs) => Object.fromEntries(docs.map((d) => [d._id, d.__rooms || []])));
			expect(remaining.u1_newkey).toContain(rid);
			expect(remaining.u4_newkey).toContain(rid);
			expect(remaining.u2_newkey).not.toContain(rid);
			expect(remaining.u3_newkey).not.toContain(rid);
		});

		it('handles duplicate values in room attributes equivalently to unique set (logs non compliant and removes them)', async () => {
			const rid = await insertRoom([]);

			await Promise.all([
				insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]),
				insertUsers([
					{ _id: 'u1_dupvals', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] },
					{ _id: 'u2_dupvals', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // non compliant (missing sales)
				]),
			]);

			await service.setRoomAbacAttributes(rid, { dept: ['eng', 'eng', 'sales'] }, fakeActor);

			expect(auditSpy).toHaveBeenCalledTimes(1);
			expect(auditSpy.mock.calls[0][0]).toMatchObject({ _id: 'u2_dupvals', username: 'u2_dupvals' });
			expect(auditSpy.mock.calls[0][1]).toMatchObject({ _id: rid });
			expect(auditSpy.mock.calls[0][2]).toBe('room-attributes-change');

			const u1 = await usersCol.findOne({ _id: 'u1_dupvals' }, { projection: { __rooms: 1 } });
			const u2 = await usersCol.findOne({ _id: 'u2_dupvals' }, { projection: { __rooms: 1 } });
			expect(u1?.__rooms || []).toContain(rid);
			expect(u2?.__rooms || []).not.toContain(rid);
		});
	});

	describe('updateRoomAbacAttributeValues - new value addition', () => {
		it('logs users missing newly added value while retaining compliant ones and removes the missing ones', async () => {
			const rid = await insertRoom([{ key: 'dept', values: ['eng'] }]);

			await Promise.all([
				insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]),
				insertUsers([
					{ _id: 'u1_newval', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] }, // already superset
					{ _id: 'u2_newval', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // missing new value
					{ _id: 'u3_newval', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] }, // superset
				]),
			]);

			await service.updateRoomAbacAttributeValues(rid, 'dept', ['eng', 'sales'], fakeActor);

			expect(auditSpy).toHaveBeenCalledTimes(1);
			expect(auditSpy.mock.calls[0][0]).toMatchObject({ _id: 'u2_newval', username: 'u2_newval' });
			expect(auditSpy.mock.calls[0][1]).toMatchObject({ _id: rid });
			expect(auditSpy.mock.calls[0][2]).toBe('room-attributes-change');

			const users = await usersCol
				.find({ _id: { $in: ['u1_newval', 'u2_newval', 'u3_newval'] } }, { projection: { __rooms: 1 } })
				.toArray()
				.then((docs) => Object.fromEntries(docs.map((d) => [d._id, d.__rooms || []])));
			expect(users.u1_newval).toContain(rid);
			expect(users.u3_newval).toContain(rid);
			expect(users.u2_newval).not.toContain(rid);
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
		it('enforces all attributes (AND semantics) removing users failing any', async () => {
			const rid = await insertRoom([{ key: 'dept', values: ['eng'] }]);

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

			const memberships = await usersCol
				.find({ _id: { $in: ['u1_multi', 'u2_multi', 'u3_multi', 'u4_multi', 'u5_multi'] } }, { projection: { __rooms: 1 } })
				.toArray()
				.then((docs) => Object.fromEntries(docs.map((d) => [d._id, d.__rooms || []])));
			expect(memberships.u1_multi).toContain(rid);
			expect(memberships.u4_multi).toContain(rid);
			expect(memberships.u2_multi).not.toContain(rid);
			expect(memberships.u3_multi).not.toContain(rid);
			expect(memberships.u5_multi).not.toContain(rid);
		});
	});

	describe('Idempotency & no-op behavior', () => {
		it('does not remove anyone when calling with identical attribute set twice', async () => {
			const rid = await insertRoom([]);

			await Promise.all([
				insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]),
				insertUsers([
					{ _id: 'u1_idem', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] },
					{ _id: 'u2_idem', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // will be removed on first pass
				]),
			]);

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
		it('keeps user with superset values and removes user missing one required value', async () => {
			const rid = await insertRoom([]);

			await Promise.all([
				insertDefinitions([{ key: 'dept', values: ['eng', 'sales', 'hr'] }]),
				insertUsers([
					{ _id: 'u1_superset', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] },
					{ _id: 'u2_superset', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'hr'] }] }, // missing sales
				]),
			]);

			await service.setRoomAbacAttributes(rid, { dept: ['eng', 'sales', 'hr'] }, fakeActor);

			expect(auditSpy).toHaveBeenCalledTimes(1);
			expect(auditSpy.mock.calls[0][0]).toMatchObject({ _id: 'u2_superset', username: 'u2_superset' });
			expect(auditSpy.mock.calls[0][1]).toMatchObject({ _id: rid });
			expect(auditSpy.mock.calls[0][2]).toBe('room-attributes-change');

			const u1 = await usersCol.findOne({ _id: 'u1_superset' }, { projection: { __rooms: 1 } });
			const u2 = await usersCol.findOne({ _id: 'u2_superset' }, { projection: { __rooms: 1 } });
			expect(u1?.__rooms || []).toContain(rid);
			expect(u2?.__rooms || []).not.toContain(rid);
		});

		it('removes user missing attribute key entirely', async () => {
			const rid = await insertRoom([]);

			await Promise.all([
				insertDefinitions([{ key: 'region', values: ['emea', 'apac'] }]),
				insertUsers([
					{ _id: 'u1_misskey', member: true, extraRooms: [rid], abacAttributes: [{ key: 'region', values: ['emea'] }] },
					{ _id: 'u2_misskey', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // missing region
					{ _id: 'u3_misskey', member: true, extraRooms: [rid] }, // no abacAttributes field
				]),
			]);

			await service.setRoomAbacAttributes(rid, { region: ['emea'] }, fakeActor);

			expect(auditSpy).toHaveBeenCalledTimes(2);
			const auditedUsers = auditSpy.mock.calls.map((call) => call[0]._id).sort();
			expect(auditedUsers).toEqual(['u2_misskey', 'u3_misskey']);
			const auditedRooms = new Set(auditSpy.mock.calls.map((call) => call[1]._id));
			expect(auditedRooms).toEqual(new Set([rid]));
			const auditedActions = new Set(auditSpy.mock.calls.map((call) => call[2]));
			expect(auditedActions).toEqual(new Set(['room-attributes-change']));

			const memberships = await usersCol
				.find({ _id: { $in: ['u1_misskey', 'u2_misskey', 'u3_misskey'] } }, { projection: { __rooms: 1 } })
				.toArray()
				.then((docs) => Object.fromEntries(docs.map((d) => [d._id, d.__rooms || []])));
			expect(memberships.u1_misskey).toContain(rid);
			expect(memberships.u2_misskey).not.toContain(rid);
			expect(memberships.u3_misskey).not.toContain(rid);
		});
	});

	describe('Large member set performance sanity (lightweight)', () => {
		it('removes only expected fraction in a larger population', async () => {
			const rid = await insertRoom([]);

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

			const remainingCount = await usersCol.countDocuments({ __rooms: rid });
			expect(remainingCount).toBe(150);
		});
	});
});
