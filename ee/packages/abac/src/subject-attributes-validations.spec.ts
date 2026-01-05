import type { ILDAPEntry, IUser, IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { registerModel, Users, UsersRaw, RoomsRaw, AbacAttributesRaw, ServerEventsRaw } from '@rocket.chat/models';
import type { Collection, Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AbacService } from './index';

jest.mock('@rocket.chat/core-services', () => ({
	ServiceClass: class {},
	Room: {
		removeUserFromRoom: jest.fn(),
	},
	MeteorError: class extends Error {},
}));

const makeUser = (overrides: Partial<IUser> = {}): IUser =>
	({
		_id: `user-fixed-id-${Math.random()}`,
		username: 'user-fixed-username',
		roles: [],
		type: 'user',
		active: true,
		createdAt: new Date(0),
		_updatedAt: new Date(0),
		...overrides,
	}) as IUser;

const makeLdap = (overrides: Partial<ILDAPEntry> = {}): ILDAPEntry =>
	({
		...overrides,
	}) as ILDAPEntry;

describe('Subject Attributes validation', () => {
	let db: Db;
	let mongo: MongoMemoryServer;
	let client: MongoClient;
	const service = new AbacService();

	let roomsCol: Collection<any>;
	let usersCol: Collection<any>;

	const insertRooms = async (rooms: { _id: string; abacAttributes?: IAbacAttributeDefinition[] }[]) => {
		await roomsCol.insertMany(
			rooms.map((room) => ({
				_id: room._id,
				name: room._id,
				t: 'p',
				abacAttributes: room.abacAttributes,
			})),
		);
	};

	beforeAll(async () => {
		mongo = await MongoMemoryServer.create();
		client = await MongoClient.connect(mongo.getUri(), {});
		db = client.db('abac_global');

		// Register only the models we actually need for these tests
		registerModel('IUsersModel', () => new UsersRaw(db));
		registerModel('IRoomsModel', () => new RoomsRaw(db));
		registerModel('IAbacAttributesModel', () => new AbacAttributesRaw(db));
		registerModel('IServerEventsModel', () => new ServerEventsRaw(db));

		// @ts-expect-error - ignore
		await db.collection('abac_dummy_init').insertOne({ _id: 'init', createdAt: new Date(0) });

		roomsCol = db.collection('rocketchat_room');
		usersCol = db.collection('users');
	}, 30_000);

	afterAll(async () => {
		await client.close();
		await mongo.stop();
	});

	beforeEach(async () => {
		// Clear state between tests while reusing the same in-memory DB & models
		await Promise.all([usersCol.deleteMany({}), roomsCol.deleteMany({})]);
	});

	const insertUser = async (user: IUser) => {
		await usersCol.insertOne(user);
	};

	describe('AbacService.addSubjectAttributes (unit)', () => {
		describe('early returns and no-ops', () => {
			it('returns early when user has no _id', async () => {
				const user = makeUser({ _id: undefined });
				await service.addSubjectAttributes(user, makeLdap(), { group: 'dept' });
				// Nothing inserted, ensure no user doc created
				const found = await Users.findOne({ username: user.username });
				expect(found).toBeFalsy();
			});

			it('does nothing (no update) when map produces no attributes and user had none', async () => {
				const user = makeUser({ abacAttributes: undefined });
				await insertUser(user);
				const ldap = makeLdap({ group: '' });
				await service.addSubjectAttributes(user, ldap, { group: 'dept' });
				const updated = await Users.findOneById(user._id, { projection: { abacAttributes: 1 } });
				expect(updated).toBeTruthy();
				expect(updated?.abacAttributes ?? undefined).toBeUndefined();
			});
		});

		describe('building and setting attributes', () => {
			it('merges multiple LDAP keys mapping to the same ABAC key, deduplicating values', async () => {
				const user = makeUser();
				await insertUser(user);
				const ldap = makeLdap({
					memberOf: ['eng', 'sales', 'eng'],
					department: ['sales', 'support'],
				});
				const map = { memberOf: 'dept', department: 'dept' };
				await service.addSubjectAttributes(user, ldap, map);
				const updated = await Users.findOneById(user._id, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([{ key: 'dept', values: ['eng', 'sales', 'support'] }]);
			});

			it('creates distinct ABAC attributes for different mapped keys preserving insertion order', async () => {
				const user = makeUser();
				await insertUser(user);
				const ldap = makeLdap({
					groups: ['alpha', 'beta'],
					regionCodes: ['emea', 'apac'],
					role: 'admin',
				});
				const map = { groups: 'team', regionCodes: 'region', role: 'role' };
				await service.addSubjectAttributes(user, ldap, map);
				const updated = await Users.findOneById(user._id, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([
					{ key: 'team', values: ['alpha', 'beta'] },
					{ key: 'region', values: ['emea', 'apac'] },
					{ key: 'role', values: ['admin'] },
				]);
			});

			it('merges array and string LDAP values into one attribute', async () => {
				const user = makeUser();
				await insertUser(user);
				const ldap = makeLdap({ deptCode: 'eng', deptName: ['engineering', 'eng'] });
				const map = { deptCode: 'dept', deptName: 'dept' };
				await service.addSubjectAttributes(user, ldap, map);
				const updated = await Users.findOneById(user._id, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([{ key: 'dept', values: ['eng', 'engineering'] }]);
			});
		});

		describe('unsetting attributes when none extracted', () => {
			it('unsets abacAttributes when user previously had attributes but now extracts none', async () => {
				const user = makeUser({ abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });
				await insertUser(user);
				const ldap = makeLdap({ other: ['x'] });
				const map = { missing: 'dept' };
				await service.addSubjectAttributes(user, ldap, map);
				const updated = await Users.findOneById(user._id, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toBeUndefined();
			});

			it('does not unset when user had no prior attributes and extraction yields none', async () => {
				const user = makeUser({ abacAttributes: [] });
				await insertUser(user);
				const ldap = makeLdap({});
				const map = { missing: 'dept' };
				await service.addSubjectAttributes(user, ldap, map);
				const updated = await Users.findOneById(user._id, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([]);
			});
		});

		describe('loss detection triggering hook (attribute changes)', () => {
			it('updates attributes reducing values on loss', async () => {
				const user = makeUser({ abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }] });
				await insertUser(user);
				const ldap = makeLdap({ memberOf: ['eng'] });
				await service.addSubjectAttributes(user, ldap, { memberOf: 'dept' });
				const updated = await Users.findOneById(user._id, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([{ key: 'dept', values: ['eng'] }]);
			});

			it('updates attributes removing an entire key', async () => {
				const user = makeUser({
					abacAttributes: [
						{ key: 'dept', values: ['eng'] },
						{ key: 'region', values: ['emea'] },
					],
				});
				await insertUser(user);
				const ldap = makeLdap({ department: ['eng'] });
				await service.addSubjectAttributes(user, ldap, { department: 'dept' });
				const updated = await Users.findOneById(user._id, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([{ key: 'dept', values: ['eng'] }]);
			});

			it('gains new values without triggering loss logic', async () => {
				const user = makeUser({ abacAttributes: [{ key: 'dept', values: ['eng'] }] });
				await insertUser(user);
				const ldap = makeLdap({ memberOf: ['eng', 'qa'] });
				await service.addSubjectAttributes(user, ldap, { memberOf: 'dept' });
				const updated = await Users.findOneById(user._id, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([{ key: 'dept', values: ['eng', 'qa'] }]);
			});

			it('keeps attributes unchanged when only ordering differs', async () => {
				const user = makeUser({ abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }] });
				await insertUser(user);
				const ldap = makeLdap({ memberOf: ['qa', 'eng'] });
				await service.addSubjectAttributes(user, ldap, { memberOf: 'dept' });
				const updated = await Users.findOneById(user._id, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes?.[0].key).toBe('dept');
				expect(new Set(updated?.abacAttributes?.[0].values)).toEqual(new Set(['eng', 'qa']));
			});

			it('merges duplicate LDAP mapping keys retaining union of values', async () => {
				const user = makeUser({ abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });
				await insertUser(user);
				const ldap = makeLdap({ deptA: ['eng', 'sales'], deptB: ['eng'] });
				await service.addSubjectAttributes(user, ldap, { deptA: 'dept', deptB: 'dept' });
				const updated = await Users.findOneById(user._id, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([{ key: 'dept', values: ['eng', 'sales'] }]);
			});
		});

		describe('input immutability', () => {
			let sharedUser: IUser;
			let original: IAbacAttributeDefinition[];
			let clone: IAbacAttributeDefinition[];

			beforeAll(async () => {
				original = [{ key: 'dept', values: ['eng', 'sales'] }] as IAbacAttributeDefinition[];
				clone = JSON.parse(JSON.stringify(original));
				sharedUser = makeUser({ abacAttributes: original });
				await insertUser(sharedUser);
			});

			afterAll(async () => {
				await usersCol.deleteOne({ _id: sharedUser._id });
			});

			it('does not mutate original user.abacAttributes array reference contents', async () => {
				const ldap = makeLdap({ memberOf: ['eng', 'sales', 'support'] });
				await service.addSubjectAttributes(sharedUser, ldap, { memberOf: 'dept' });
				expect(original).toEqual(clone);
			});
		});
	});

	describe('AbacService.addSubjectAttributes (room removals)', () => {
		const originalCoreServices = jest.requireMock('@rocket.chat/core-services');
		originalCoreServices.Room.removeUserFromRoom = async (rid: string, user: IUser) => {
			// @ts-expect-error - test
			await usersCol.updateOne({ _id: user._id }, { $pull: { __rooms: rid } });
		};

		const insertUserForRemovalTests = async (user: IUser & { __rooms?: string[] }) =>
			usersCol.insertOne({
				...user,
				__rooms: user.__rooms || [],
			});

		it('removes user from rooms whose attributes become non-compliant after losing a value', async () => {
			const user: IUser = {
				_id: 'u-loss',
				username: 'lossy',
				roles: [],
				type: 'user',
				active: true,
				createdAt: new Date(),
				_updatedAt: new Date(),
				abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }],
				__rooms: ['rKeep', 'rRemove'],
			};

			// Rooms:
			// rKeep requires only 'eng' (will remain compliant)
			// rRemove requires both 'eng' and 'qa' (will become non-compliant after loss)
			await insertRooms([
				{ _id: 'rKeep', abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'rRemove', abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }] },
			]);

			await insertUserForRemovalTests({ ...user, __rooms: ['rKeep', 'rRemove'] });

			const ldap: ILDAPEntry = {
				memberOf: ['eng'],
				_raw: {},
			};

			await service.addSubjectAttributes(user, ldap, { memberOf: 'dept' });

			const updatedUser = await usersCol.findOne({ _id: user._id }, { projection: { abacAttributes: 1, __rooms: 1 } });
			expect(updatedUser?.abacAttributes).toEqual([{ key: 'dept', values: ['eng'] }]);
			expect(updatedUser?.abacAttributes).not.toEqual(user.abacAttributes);
			expect(updatedUser?.__rooms.sort()).toEqual(['rKeep']);
		});

		it('removes user from rooms containing attribute keys they no longer possess (key loss)', async () => {
			const user: IUser = {
				_id: 'u-key-loss',
				username: 'keyloss',
				roles: [],
				type: 'user',
				active: true,
				createdAt: new Date(),
				_updatedAt: new Date(),
				abacAttributes: [
					{ key: 'dept', values: ['eng'] },
					{ key: 'region', values: ['emea'] },
				],
				__rooms: ['rDeptOnly', 'rRegionOnly', 'rBoth'],
			};

			// Rooms:
			// rDeptOnly -> only dept (will stay)
			// rRegionOnly -> region only (will be removed after region key loss)
			// rBoth -> both dept & region (will be removed)
			await insertRooms([
				{ _id: 'rDeptOnly', abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'rRegionOnly', abacAttributes: [{ key: 'region', values: ['emea'] }] },
				{
					_id: 'rBoth',
					abacAttributes: [
						{ key: 'dept', values: ['eng'] },
						{ key: 'region', values: ['emea'] },
					],
				},
			]);

			await insertUserForRemovalTests({ ...user, __rooms: ['rDeptOnly', 'rRegionOnly', 'rBoth'] });

			const ldap: ILDAPEntry = {
				department: ['eng'],
				_raw: {},
			};

			await service.addSubjectAttributes(user, ldap, { department: 'dept' });

			const updatedUser = await usersCol.findOne({ _id: user._id }, { projection: { abacAttributes: 1, __rooms: 1 } });
			expect(updatedUser?.abacAttributes).toEqual([{ key: 'dept', values: ['eng'] }]);
			expect(updatedUser?.abacAttributes).not.toEqual(user.abacAttributes);
			expect(updatedUser?.__rooms).toEqual(['rDeptOnly']);
		});

		it('does not remove user from any room when attribute values only grow (gain without loss)', async () => {
			const user: IUser = {
				_id: 'u-growth',
				username: 'growth',
				roles: [],
				type: 'user',
				active: true,
				createdAt: new Date(),
				_updatedAt: new Date(),
				abacAttributes: [{ key: 'dept', values: ['eng'] }],
				__rooms: ['rGrowthA', 'rGrowthB'],
			};

			await insertRooms([
				{ _id: 'rGrowthA', abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'rGrowthB', abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }] }, // superset; still compliant after growth
			]);

			await insertUserForRemovalTests({ ...user, __rooms: ['rGrowthA', 'rGrowthB'] });

			const ldap: ILDAPEntry = {
				memberOf: ['eng', 'qa'],
				_raw: {},
			};

			await service.addSubjectAttributes(user, ldap, { memberOf: 'dept' });

			const updatedUser = await usersCol.findOne({ _id: user._id }, { projection: { abacAttributes: 1, __rooms: 1 } });
			expect(updatedUser?.abacAttributes).toEqual([{ key: 'dept', values: ['eng', 'qa'] }]);
			expect(updatedUser?.__rooms.sort()).toEqual(['rGrowthA', 'rGrowthB']);
		});

		it('removes user from rooms having attribute keys not present in new attribute set (extra keys in room)', async () => {
			const user: IUser = {
				_id: 'u-extra-room-key',
				username: 'extrakey',
				roles: [],
				type: 'user',
				active: true,
				createdAt: new Date(),
				_updatedAt: new Date(),
				abacAttributes: [
					{ key: 'dept', values: ['eng', 'sales'] },
					{ key: 'otherKey', values: ['value'] },
				],
				__rooms: ['rExtraKeyRoom', 'rBaseline'],
			};

			await insertRooms([
				{
					_id: 'rExtraKeyRoom',
					abacAttributes: [
						{ key: 'dept', values: ['eng', 'sales'] },
						{ key: 'project', values: ['X'] },
					],
				},
				{
					_id: 'rBaseline',
					abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }],
				},
			]);

			await insertUserForRemovalTests({ ...user, __rooms: ['rExtraKeyRoom', 'rBaseline'] });

			const ldap: ILDAPEntry = {
				deptCodes: ['eng', 'sales'],
				_raw: {},
			};

			await service.addSubjectAttributes(user, ldap, { deptCodes: 'dept' });

			const updatedUser = await usersCol.findOne({ _id: user._id }, { projection: { abacAttributes: 1, __rooms: 1 } });
			expect(updatedUser?.abacAttributes).toEqual([{ key: 'dept', values: ['eng', 'sales'] }]);
			expect(updatedUser?.__rooms.sort()).toEqual(['rBaseline']);
		});

		it('unsets attributes and removes user from all ABAC rooms when no LDAP values extracted', async () => {
			const user: IUser = {
				_id: 'u-empty',
				username: 'empty',
				roles: [],
				type: 'user',
				active: true,
				createdAt: new Date(),
				_updatedAt: new Date(),
				abacAttributes: [{ key: 'dept', values: ['eng'] }],
				__rooms: ['rAny1', 'rAny2'],
			};

			await insertRooms([
				{ _id: 'rAny1', abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'rAny2', abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }] },
			]);

			await insertUserForRemovalTests({ ...user, __rooms: ['rAny1', 'rAny2'] });

			const ldap: ILDAPEntry = {
				unrelated: ['x'],
				_raw: {},
			};

			await service.addSubjectAttributes(user, ldap, { missing: 'dept' });

			const updatedUser = await usersCol.findOne({ _id: user._id }, { projection: { abacAttributes: 1, __rooms: 1 } });
			expect(updatedUser?.abacAttributes).toBeUndefined();
			expect(updatedUser?.abacAttributes).not.toEqual(user.abacAttributes);
			expect(updatedUser?.__rooms).toEqual([]);
		});

		it('does not remove user from room when losing attribute not used by room (hook runs but no change)', async () => {
			const user: IUser = {
				_id: 'u-lose-unrelated',
				username: 'unrelated',
				roles: [],
				type: 'user',
				active: true,
				createdAt: new Date(),
				_updatedAt: new Date(),
				abacAttributes: [
					{ key: 'dept', values: ['eng'] },
					{ key: 'region', values: ['emea'] },
					{ key: 'project', values: ['X'] },
				],
				__rooms: ['rDeptRegion'],
			};

			await insertRooms([
				{
					_id: 'rDeptRegion',
					abacAttributes: [
						{ key: 'dept', values: ['eng'] },
						{ key: 'region', values: ['emea'] },
					],
				},
			]);

			await insertUserForRemovalTests({ ...user, __rooms: ['rDeptRegion'] });

			const ldap: ILDAPEntry = {
				department: ['eng', 'ceo'],
				regionCodes: ['emea', 'apac'],
				_raw: {},
			};

			await service.addSubjectAttributes(user, ldap, { department: 'dept', regionCodes: 'region', projectCodes: 'project' });

			const updatedUser = await usersCol.findOne({ _id: user._id }, { projection: { abacAttributes: 1, __rooms: 1 } });
			expect(updatedUser?.abacAttributes).toEqual([
				{ key: 'dept', values: ['eng', 'ceo'] },
				{ key: 'region', values: ['emea', 'apac'] },
			]);
			expect(updatedUser?.abacAttributes).not.toEqual(user.abacAttributes);
			expect(updatedUser?.__rooms).toEqual(['rDeptRegion']);
		});
	});
});
