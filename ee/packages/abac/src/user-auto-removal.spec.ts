import type { IAbacAttributeDefinition, IRoom, IUser } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';
import type { Collection, Db } from 'mongodb';

import { Audit } from './audit';
import { AbacService } from './index';
import { acquireSharedInMemoryMongo, SHARED_ABAC_TEST_DB, type SharedMongoConnection } from './test-helpers/mongoMemoryServer';

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
	let sharedMongo: SharedMongoConnection;
	let db: Db;
	const service = new AbacService();

	let roomsCol: Collection<IRoom>;
	let usersCol: Collection<IUser>;

	const fakeActor = { _id: 'test-user', username: 'testuser', type: 'user' };

	const insertDefinitions = async (defs: { key: string; values: string[] }[]) => {
		await Promise.all(
			defs.map((def) =>
				service.addAbacAttribute({ key: def.key, values: def.values }, fakeActor).catch((e: any) => {
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

	type TestUserSeed = {
		_id: string;
		abacAttributes?: IAbacAttributeDefinition[];
		member?: boolean;
		extraRooms?: string[];
	};

	const insertUsers = async (users: TestUserSeed[]) => {
		await usersCol.insertMany(
			users.map((u) => {
				const doc: Partial<IUser> & {
					_id: string;
					username: string;
					type: IUser['type'];
					roles: IUser['roles'];
					active: boolean;
					createdAt: Date;
					_updatedAt: Date;
					__rooms: string[];
				} = {
					_id: u._id,
					username: u._id,
					type: 'user',
					roles: [],
					active: true,
					createdAt: new Date(),
					_updatedAt: new Date(),
					__rooms: u.extraRooms || [],
				};
				if (u.abacAttributes !== undefined) {
					doc.abacAttributes = u.abacAttributes;
				}
				return doc as IUser;
			}),
		);
	};

	const staticUserIds = [
		'u1_newkey',
		'u2_newkey',
		'u3_newkey',
		'u4_newkey',
		'u5_newkey',
		'u1_dupvals',
		'u2_dupvals',
		'u1_newval',
		'u2_newval',
		'u3_newval',
		'u1_rmval',
		'u2_rmval',
		'u1_multi',
		'u2_multi',
		'u3_multi',
		'u4_multi',
		'u5_multi',
		'u1_idem',
		'u2_idem',
		'u1_superset',
		'u2_superset',
		'u1_misskey',
		'u2_misskey',
		'u3_misskey',
	];

	const staticTestUsers: TestUserSeed[] = staticUserIds.map((_id) => ({ _id }));

	const resetStaticUsers = async () => {
		await usersCol.updateMany(
			{ _id: { $in: staticUserIds } },
			{
				$set: {
					__rooms: [],
					_updatedAt: new Date(),
				},
				$unset: {
					abacAttributes: 1,
				},
			},
		);
	};

	const configureStaticUsers = async (users: TestUserSeed[]) => {
		const operations = users.map((user) => {
			const setPayload: Partial<IUser> = {
				__rooms: user.extraRooms ?? [],
				_updatedAt: new Date(),
			};

			if (user.abacAttributes !== undefined) {
				setPayload.abacAttributes = user.abacAttributes;
			}

			const update: {
				$set: Partial<IUser>;
				$unset?: Record<string, 1>;
			} = {
				$set: setPayload,
			};

			if (user.abacAttributes === undefined) {
				update.$unset = { abacAttributes: 1 };
			}

			return {
				updateOne: {
					filter: { _id: user._id },
					update,
				},
			};
		});

		if (!operations.length) {
			return;
		}

		await usersCol.bulkWrite(operations);
	};

	// It's utterly incredible i have to do this so the tests are "fast" because mongo is not warm
	// I could have increased the timeout for the first test too but...
	const dbWarmup = async () => {
		const uniqueSuffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
		const warmupAttributeKey = `warmup_seed_${uniqueSuffix}`;
		const warmupUserId = `warmup-abac-user-${uniqueSuffix}`;
		const warmupRid = await insertRoom([]);
		const subscriptionCol = db.collection<any>('rocketchat_subscription');
		const seedSubscriptionId = `warmup-${uniqueSuffix}`;

		await subscriptionCol.insertOne({
			_id: seedSubscriptionId,
			rid: `warmup-room-${uniqueSuffix}`,
			u: { _id: `warmup-user-${uniqueSuffix}` },
		} as any);
		await insertDefinitions([{ key: warmupAttributeKey, values: ['a'] }]);
		await insertUsers([{ _id: warmupUserId, member: true, extraRooms: [warmupRid] }]);
		await subscriptionCol.insertOne({
			_id: `warmup-sub-${uniqueSuffix}`,
			rid: warmupRid,
			u: { _id: warmupUserId },
		} as any);

		try {
			await service.setRoomAbacAttributes(warmupRid, { [warmupAttributeKey]: ['a'] }, fakeActor);
		} finally {
			await roomsCol.deleteOne({ _id: warmupRid });
			await usersCol.deleteOne({ _id: warmupUserId });
			await subscriptionCol.deleteMany({
				_id: { $in: [seedSubscriptionId, `warmup-sub-${uniqueSuffix}`] },
			});
			await subscriptionCol.deleteMany({ rid: warmupRid });
			await db.collection<any>('rocketchat_abac_attributes').deleteOne({ key: warmupAttributeKey });
		}
	};

	let debugSpy: jest.SpyInstance;
	let auditSpy: jest.SpyInstance;

	beforeAll(async () => {
		sharedMongo = await acquireSharedInMemoryMongo(SHARED_ABAC_TEST_DB);
		db = sharedMongo.db;

		debugSpy = jest.spyOn((service as any).logger, 'debug').mockImplementation(() => undefined);
		auditSpy = jest.spyOn(Audit, 'actionPerformed').mockResolvedValue();

		roomsCol = db.collection<IRoom>('rocketchat_room');
		usersCol = db.collection<IUser>('users');
		await usersCol.deleteMany({ _id: { $in: staticUserIds } });
		await insertUsers(staticTestUsers);

		await dbWarmup();
	}, 30_000);

	afterAll(async () => {
		await usersCol.deleteMany({ _id: { $in: staticUserIds } });
		await sharedMongo.release();
	});

	beforeEach(async () => {
		debugSpy.mockClear();
		auditSpy.mockClear();
		await resetStaticUsers();
	});

	describe('setRoomAbacAttributes - new key addition', () => {
		let rid1: string;
		let rid2: string;

		beforeEach(async () => {
			rid1 = await insertRoom([]);
			rid2 = await insertRoom([]);

			await insertDefinitions([
				{ key: 'dept', values: ['eng', 'sales', 'hr'] },
				{ key: 'dep2t', values: ['eng', 'sales'] },
			]);

			await configureStaticUsers([
				{ _id: 'u1_newkey', member: true, extraRooms: [rid1], abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] }, // compliant
				{ _id: 'u2_newkey', member: true, extraRooms: [rid1], abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // missing sales
				{ _id: 'u3_newkey', member: true, extraRooms: [rid1], abacAttributes: [{ key: 'location', values: ['emea'] }] }, // missing dept key
				{ _id: 'u4_newkey', member: true, extraRooms: [rid1], abacAttributes: [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] }, // superset
				{ _id: 'u5_newkey', member: false, abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] }, // not in room
				{ _id: 'u1_dupvals', member: true, extraRooms: [rid2], abacAttributes: [{ key: 'dep2t', values: ['eng', 'sales'] }] },
				{ _id: 'u2_dupvals', member: true, extraRooms: [rid2], abacAttributes: [{ key: 'dep2t', values: ['eng'] }] }, // non compliant (missing sales)
			]);
		});

		afterEach(async () => {
			await roomsCol.deleteMany({ _id: { $in: [rid1, rid2] } });
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
		describe('when adding new values', () => {
			let rid: string;

			beforeEach(async () => {
				rid = await insertRoom([{ key: 'dept', values: ['eng'] }]);

				await insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]);
				await configureStaticUsers([
					{ _id: 'u1_newval', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] }, // already superset
					{ _id: 'u2_newval', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // missing new value
					{ _id: 'u3_newval', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] }, // superset
				]);
			});

			afterEach(async () => {
				await roomsCol.deleteOne({ _id: rid });
			});

			it('logs users missing newly added value while retaining compliant ones and removes the missing ones', async () => {
				await service.updateRoomAbacAttributeValues(rid, 'dept', ['eng', 'sales'], fakeActor);

				expect(auditSpy).toHaveBeenCalledTimes(1);
				expect(auditSpy.mock.calls[0][0]).toMatchObject({ _id: 'u2_newval', username: 'u2_newval' });
				expect(auditSpy.mock.calls[0][1]).toMatchObject({ _id: rid });
				expect(auditSpy.mock.calls[0][2]).toBe('room-attributes-change');
			});
		});

		describe('when only removing values', () => {
			let rid: string;

			beforeEach(async () => {
				rid = await insertRoom([{ key: 'dept', values: ['eng', 'sales'] }]);

				await insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]);
				await configureStaticUsers([
					{ _id: 'u1_rmval', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng'] }] },
					{ _id: 'u2_rmval', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] },
				]);
			});

			afterEach(async () => {
				await roomsCol.deleteOne({ _id: rid });
			});

			it('produces no evaluation log when only removing values from existing attribute', async () => {
				await service.updateRoomAbacAttributeValues(rid, 'dept', ['eng'], fakeActor); // removal only

				expect(auditSpy).not.toHaveBeenCalled();

				// nobody removed because removal only does not trigger reevaluation
				const u1 = await usersCol.findOne({ _id: 'u1_rmval' }, { projection: { __rooms: 1 } });
				const u2 = await usersCol.findOne({ _id: 'u2_rmval' }, { projection: { __rooms: 1 } });
				expect(u1?.__rooms || []).toContain(rid);
				expect(u2?.__rooms || []).toContain(rid);
			});
		});
	});

	describe('setRoomAbacAttributes - multi-attribute addition', () => {
		let rid: string;

		beforeEach(async () => {
			rid = await insertRoom([{ key: 'dept', values: ['eng'] }]);

			await insertDefinitions([
				{ key: 'dept', values: ['eng', 'sales', 'hr'] },
				{ key: 'region', values: ['emea', 'apac'] },
			]);

			await configureStaticUsers([
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
			]);
		});

		afterEach(async () => {
			await roomsCol.deleteOne({ _id: rid });
		});

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

		beforeEach(async () => {
			rid = await insertRoom([]);

			await insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]);
			await configureStaticUsers([
				{ _id: 'u1_idem', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] },
				{ _id: 'u2_idem', member: true, extraRooms: [rid], abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // will be removed on first pass
			]);
		});
		afterEach(async () => {
			await roomsCol.deleteOne({ _id: rid });
		});

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

		beforeEach(async () => {
			ridSuperset = await insertRoom([]);

			await insertDefinitions([{ key: 'dept', values: ['eng', 'sales', 'hr'] }]);
			await configureStaticUsers([
				{
					_id: 'u1_superset',
					member: true,
					extraRooms: [ridSuperset],
					abacAttributes: [{ key: 'dept', values: ['eng', 'sales', 'hr'] }],
				},
				{ _id: 'u2_superset', member: true, extraRooms: [ridSuperset], abacAttributes: [{ key: 'dept', values: ['eng', 'hr'] }] }, // missing sales
			]);

			ridMissingKey = await insertRoom([]);

			await insertDefinitions([{ key: 'region', values: ['emea', 'apac'] }]);
			await configureStaticUsers([
				{ _id: 'u1_misskey', member: true, extraRooms: [ridMissingKey], abacAttributes: [{ key: 'region', values: ['emea'] }] },
				{ _id: 'u2_misskey', member: true, extraRooms: [ridMissingKey], abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // missing region
				{ _id: 'u3_misskey', member: true, extraRooms: [ridMissingKey] }, // no abacAttributes field
			]);
		});

		afterEach(async () => {
			await roomsCol.deleteMany({ _id: { $in: [ridSuperset, ridMissingKey] } });
		});

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
		let bulkIds: string[];

		beforeEach(async () => {
			rid = await insertRoom([]);

			await insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]);

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
			bulkIds = bulk.map((u) => u._id);
			await insertUsers(bulk);
		});

		afterEach(async () => {
			await usersCol.deleteMany({
				_id: { $in: bulkIds },
			});
			await roomsCol.deleteOne({ _id: rid });
		});

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
