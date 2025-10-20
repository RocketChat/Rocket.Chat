import type { IAbacAttributeDefinition, IRoom, IUser } from '@rocket.chat/core-typings';
import { registerServiceModels } from '@rocket.chat/models';
import type { Collection, Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

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
	let defsCol: Collection<any>;
	const rid = 'r1';

	const insertDefinitions = async (defs: { key: string; values: string[] }[]) => {
		const svc = new AbacService();
		await Promise.all(
			defs.map((def) =>
				svc.addAbacAttribute({ key: def.key, values: def.values }).catch((e: any) => {
					if (e instanceof Error && e.message === 'error-duplicate-attribute-key') {
						return;
					}
					throw e;
				}),
			),
		);
	};

	const insertRoom = async (abacAttributes: IAbacAttributeDefinition[] = []) => {
		await roomsCol.insertOne({
			_id: rid,
			t: 'p',
			name: 'Test Room',
			abacAttributes,
		} as any);
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
				__rooms: [...(u.member ? [rid] : []), ...(u.extraRooms || [])],
			})),
		);
	};

	let debugSpy: jest.SpyInstance;
	beforeAll(async () => {
		mongo = await MongoMemoryServer.create();
		client = await MongoClient.connect(mongo.getUri(), {});
		db = client.db('abac_integration');

		// Hack to register the models in here with a custom database without having to call every model by one
		registerServiceModels(db as any);

		service = new AbacService();
		debugSpy = jest.spyOn((service as any).logger, 'debug').mockImplementation(() => undefined);

		roomsCol = db.collection<IRoom>('rocketchat_room');
		usersCol = db.collection<IUser>('users');
		defsCol = db.collection('abac_attributes');
	}, 30_000);

	afterAll(async () => {
		await client.close();
		await mongo.stop();
	});

	beforeEach(async () => {
		await Promise.all([roomsCol.deleteMany({}), usersCol.deleteMany({}), defsCol.deleteMany({})]);
		debugSpy.mockClear();
	});

	describe('setRoomAbacAttributes - new key addition', () => {
		it('logs users that do not satisfy newly added attribute key or its values and actually removes them', async () => {
			await insertDefinitions([{ key: 'dept', values: ['eng', 'sales', 'hr'] }]);
			await insertRoom([]);
			await insertUsers([
				{ _id: 'u1', member: true, abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] }, // compliant
				{ _id: 'u2', member: true, abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // missing sales
				{ _id: 'u3', member: true, abacAttributes: [{ key: 'location', values: ['emea'] }] }, // missing dept key
				{ _id: 'u4', member: true, abacAttributes: [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] }, // superset
				{ _id: 'u5', member: false, abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] }, // not in room
			]);

			const debugSpy = (service as any).logger.debug as jest.Mock;
			const changeSpy = jest.spyOn<any, any>(service as any, 'onRoomAttributesChanged');

			await service.setRoomAbacAttributes(rid, { dept: ['eng', 'sales'] });

			// Assert the protected hook received the full room object (first arg) instead of just the id
			expect(changeSpy).toHaveBeenCalledTimes(1);
			expect(changeSpy.mock.calls[0][0]).toMatchObject({ _id: rid });
			expect(Array.isArray((changeSpy as any).mock.calls[0][0].abacAttributes)).toBe(true);

			const evaluationCalls = debugSpy.mock.calls.map((c) => c[0]).filter((arg) => arg && arg.msg === 'Room ABAC attributes changed');

			expect(evaluationCalls.length).toBe(1);
			const payload = evaluationCalls[0];
			expect(payload.rid).toBe(rid);
			expect(payload.newAttributes).toEqual([{ key: 'dept', values: ['eng', 'sales'] }]);
			expect(payload.usersToRemove.sort()).toEqual(['u2', 'u3']); // only non compliant

			// Assert membership actually updated
			const remaining = await usersCol
				.find({ _id: { $in: ['u1', 'u2', 'u3', 'u4'] } }, { projection: { __rooms: 1 } })
				.toArray()
				.then((docs) => Object.fromEntries(docs.map((d) => [d._id, d.__rooms || []])));
			expect(remaining.u1).toContain(rid);
			expect(remaining.u4).toContain(rid);
			expect(remaining.u2).not.toContain(rid);
			expect(remaining.u3).not.toContain(rid);
		});

		it('handles duplicate values in room attributes equivalently to unique set (logs non compliant and removes them)', async () => {
			await insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]);
			await insertRoom([]);
			await insertUsers([
				{ _id: 'u1', member: true, abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] },
				{ _id: 'u2', member: true, abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // non compliant (missing sales)
			]);

			const debugSpy = (service as any).logger.debug as jest.Mock;
			await service.setRoomAbacAttributes(rid, { dept: ['eng', 'eng', 'sales'] });

			const evaluationCalls = debugSpy.mock.calls
				.map((c: any[]) => c[0])
				.filter((arg: any) => arg && arg.msg === 'Room ABAC attributes changed');
			expect(evaluationCalls.length).toBe(1);
			expect(evaluationCalls[0].usersToRemove.sort()).toEqual(['u2']);

			const u1 = await usersCol.findOne({ _id: 'u1' }, { projection: { __rooms: 1 } });
			const u2 = await usersCol.findOne({ _id: 'u2' }, { projection: { __rooms: 1 } });
			expect(u1?.__rooms || []).toContain(rid);
			expect(u2?.__rooms || []).not.toContain(rid);
		});
	});

	describe('updateRoomAbacAttributeValues - new value addition', () => {
		it('logs users missing newly added value while retaining compliant ones and removes the missing ones', async () => {
			await insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]);
			await insertRoom([{ key: 'dept', values: ['eng'] }]);
			await insertUsers([
				{ _id: 'u1', member: true, abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] }, // already superset
				{ _id: 'u2', member: true, abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // missing new value
				{ _id: 'u3', member: true, abacAttributes: [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] }, // superset
			]);

			const debugSpy = (service as any).logger.debug as jest.Mock;
			await service.updateRoomAbacAttributeValues(rid, 'dept', ['eng', 'sales']);

			const evaluationCalls = debugSpy.mock.calls
				.map((c: any[]) => c[0])
				.filter((arg: any) => arg && arg.msg === 'Room ABAC attributes changed');
			expect(evaluationCalls.length).toBe(1);
			expect(evaluationCalls[0].usersToRemove.sort()).toEqual(['u2']);

			const users = await usersCol
				.find({ _id: { $in: ['u1', 'u2', 'u3'] } }, { projection: { __rooms: 1 } })
				.toArray()
				.then((docs) => Object.fromEntries(docs.map((d) => [d._id, d.__rooms || []])));
			expect(users.u1).toContain(rid);
			expect(users.u3).toContain(rid);
			expect(users.u2).not.toContain(rid);
		});

		it('produces no evaluation log when only removing values from existing attribute', async () => {
			await insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]);
			await insertRoom([{ key: 'dept', values: ['eng', 'sales'] }]);
			await insertUsers([
				{ _id: 'u1', member: true, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'u2', member: true, abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] },
			]);

			const debugSpy = (service as any).logger.debug as jest.Mock;
			await service.updateRoomAbacAttributeValues(rid, 'dept', ['eng']); // removal only

			const evaluationCalls = debugSpy.mock.calls
				.map((c: any[]) => c[0])
				.filter((arg: any) => arg && arg.msg === 'Re-evaluating room subscriptions');
			expect(evaluationCalls.length).toBe(0);

			// nobody removed because removal only does not trigger reevaluation
			const u1 = await usersCol.findOne({ _id: 'u1' }, { projection: { __rooms: 1 } });
			const u2 = await usersCol.findOne({ _id: 'u2' }, { projection: { __rooms: 1 } });
			expect(u1?.__rooms || []).toContain(rid);
			expect(u2?.__rooms || []).toContain(rid);
		});
	});

	describe('setRoomAbacAttributes - multi-attribute addition', () => {
		it('enforces all attributes (AND semantics) removing users failing any', async () => {
			await insertDefinitions([
				{ key: 'dept', values: ['eng', 'sales', 'hr'] },
				{ key: 'region', values: ['emea', 'apac'] },
			]);
			await insertRoom([{ key: 'dept', values: ['eng'] }]);

			await insertUsers([
				{
					_id: 'u1',
					member: true,
					abacAttributes: [
						{ key: 'dept', values: ['eng', 'sales'] },
						{ key: 'region', values: ['emea'] },
					],
				}, // compliant after expansion
				{
					_id: 'u2',
					member: true,
					abacAttributes: [{ key: 'dept', values: ['eng'] }], // missing region
				},
				{
					_id: 'u3',
					member: true,
					abacAttributes: [{ key: 'region', values: ['emea'] }], // missing dept key
				},
				{
					_id: 'u4',
					member: true,
					abacAttributes: [
						{ key: 'dept', values: ['eng', 'sales', 'hr'] },
						{ key: 'region', values: ['emea', 'apac'] },
					],
				}, // superset across both
				{
					_id: 'u5',
					member: true,
					abacAttributes: [
						{ key: 'dept', values: ['eng', 'sales'] },
						{ key: 'region', values: ['apac'] },
					],
				},
			]);

			const debugSpy = (service as any).logger.debug as jest.Mock;
			await service.setRoomAbacAttributes(rid, {
				dept: ['eng', 'sales'],
				region: ['emea'],
			});

			const evaluationCalls = debugSpy.mock.calls
				.map((c: any[]) => c[0])
				.filter((arg: any) => arg && arg.msg === 'Room ABAC attributes changed');
			expect(evaluationCalls.length).toBe(1);
			expect(evaluationCalls[0].usersToRemove.sort()).toEqual(['u2', 'u3', 'u5']);

			const memberships = await usersCol
				.find({ _id: { $in: ['u1', 'u2', 'u3', 'u4', 'u5'] } }, { projection: { __rooms: 1 } })
				.toArray()
				.then((docs) => Object.fromEntries(docs.map((d) => [d._id, d.__rooms || []])));
			expect(memberships.u1).toContain(rid);
			expect(memberships.u4).toContain(rid);
			expect(memberships.u2).not.toContain(rid);
			expect(memberships.u3).not.toContain(rid);
			expect(memberships.u5).not.toContain(rid);
		});
	});

	describe('Idempotency & no-op behavior', () => {
		it('does not remove anyone when calling with identical attribute set twice', async () => {
			await insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]);
			await insertRoom([]);
			await insertUsers([
				{ _id: 'u1', member: true, abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] },
				{ _id: 'u2', member: true, abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // will be removed on first pass
			]);

			const debugSpy = (service as any).logger.debug as jest.Mock;
			await service.setRoomAbacAttributes(rid, { dept: ['eng', 'sales'] });
			const firstEval = debugSpy.mock.calls.map((c: any[]) => c[0]).filter((a: any) => a && a.msg === 'Room ABAC attributes changed');
			expect(firstEval.length).toBe(1);
			expect(firstEval[0].usersToRemove.sort()).toEqual(['u2']);

			let u1 = await usersCol.findOne({ _id: 'u1' }, { projection: { __rooms: 1 } });
			let u2 = await usersCol.findOne({ _id: 'u2' }, { projection: { __rooms: 1 } });
			expect(u1?.__rooms || []).toContain(rid);
			expect(u2?.__rooms || []).not.toContain(rid);

			// Reset mock counts for clarity
			debugSpy.mockClear();

			await service.setRoomAbacAttributes(rid, { dept: ['eng', 'sales'] });
			const secondEval = debugSpy.mock.calls.map((c: any[]) => c[0]).filter((a: any) => a && a.msg === 'Room ABAC attributes changed');
			expect(secondEval.length).toBe(0);

			u1 = await usersCol.findOne({ _id: 'u1' }, { projection: { __rooms: 1 } });
			u2 = await usersCol.findOne({ _id: 'u2' }, { projection: { __rooms: 1 } });
			expect(u1?.__rooms || []).toContain(rid);
			expect(u2?.__rooms || []).not.toContain(rid);
		});
	});

	describe('Superset and missing attribute edge cases', () => {
		it('keeps user with superset values and removes user missing one required value', async () => {
			await insertDefinitions([{ key: 'dept', values: ['eng', 'sales', 'hr'] }]);
			await insertRoom([]);
			await insertUsers([
				{ _id: 'u1', member: true, abacAttributes: [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] },
				{ _id: 'u2', member: true, abacAttributes: [{ key: 'dept', values: ['eng', 'hr'] }] }, // missing sales
			]);

			const debugSpy = (service as any).logger.debug as jest.Mock;
			await service.setRoomAbacAttributes(rid, { dept: ['eng', 'sales', 'hr'] });

			const evaluationCalls = debugSpy.mock.calls
				.map((c: any[]) => c[0])
				.filter((arg: any) => arg && arg.msg === 'Room ABAC attributes changed');
			expect(evaluationCalls.length).toBe(1);
			expect(evaluationCalls[0].usersToRemove.sort()).toEqual(['u2']);

			const u1 = await usersCol.findOne({ _id: 'u1' }, { projection: { __rooms: 1 } });
			const u2 = await usersCol.findOne({ _id: 'u2' }, { projection: { __rooms: 1 } });
			expect(u1?.__rooms || []).toContain(rid);
			expect(u2?.__rooms || []).not.toContain(rid);
		});

		it('removes user missing attribute key entirely', async () => {
			await insertDefinitions([{ key: 'region', values: ['emea', 'apac'] }]);
			await insertRoom([]);
			await insertUsers([
				{ _id: 'u1', member: true, abacAttributes: [{ key: 'region', values: ['emea'] }] },
				{ _id: 'u2', member: true, abacAttributes: [{ key: 'dept', values: ['eng'] }] }, // missing region
				{ _id: 'u3', member: true }, // no abacAttributes field
			]);

			const debugSpy = (service as any).logger.debug as jest.Mock;
			await service.setRoomAbacAttributes(rid, { region: ['emea'] });

			const evaluationCalls = debugSpy.mock.calls
				.map((c: any[]) => c[0])
				.filter((arg: any) => arg && arg.msg === 'Room ABAC attributes changed');
			expect(evaluationCalls.length).toBe(1);
			expect(evaluationCalls[0].usersToRemove.sort()).toEqual(['u2', 'u3']);

			const memberships = await usersCol
				.find({ _id: { $in: ['u1', 'u2', 'u3'] } }, { projection: { __rooms: 1 } })
				.toArray()
				.then((docs) => Object.fromEntries(docs.map((d) => [d._id, d.__rooms || []])));
			expect(memberships.u1).toContain(rid);
			expect(memberships.u2).not.toContain(rid);
			expect(memberships.u3).not.toContain(rid);
		});
	});

	describe('Large member set performance sanity (lightweight)', () => {
		it('removes only expected fraction in a larger population', async () => {
			await insertDefinitions([{ key: 'dept', values: ['eng', 'sales'] }]);
			await insertRoom([]);

			const bulk: Parameters<typeof insertUsers>[0] = [];
			for (let i = 0; i < 300; i++) {
				// Half compliant with both values, half only 'eng'
				const values = i % 2 === 0 ? ['eng', 'sales'] : ['eng'];
				bulk.push({
					_id: `u${i}`,
					member: true,
					abacAttributes: [{ key: 'dept', values }],
				});
			}
			await insertUsers(bulk);

			const debugSpy = (service as any).logger.debug as jest.Mock;
			await service.setRoomAbacAttributes(rid, { dept: ['eng', 'sales'] });

			const evaluationCalls = debugSpy.mock.calls
				.map((c: any[]) => c[0])
				.filter((arg: any) => arg && arg.msg === 'Room ABAC attributes changed');
			expect(evaluationCalls.length).toBe(1);
			const removed = evaluationCalls[0].usersToRemove;
			expect(removed.length).toBe(150);
			expect(removed).toContain('u1');
			expect(removed).toContain('u299');
			expect(removed).not.toContain('u0');
			expect(removed).not.toContain('u298');

			const remainingCount = await usersCol.countDocuments({ __rooms: rid });
			expect(remainingCount).toBe(150);
		});
	});
});
