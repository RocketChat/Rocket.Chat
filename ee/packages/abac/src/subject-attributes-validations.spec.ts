import type { ILDAPEntry, IUser, IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { Collection, Db } from 'mongodb';

import { AbacService } from './index';
import { acquireSharedInMemoryMongo, SHARED_ABAC_TEST_DB, type SharedMongoConnection } from './test-helpers/mongoMemoryServer';

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

type StaticUserDefinition = {
	_id: string;
	username: string;
};

const staticUserDefinitions: StaticUserDefinition[] = [
	{ _id: 'u-no-map-attrs', username: 'user-no-map' },
	{ _id: 'u-merge-memberof', username: 'merge-memberof' },
	{ _id: 'u-distinct-keys', username: 'distinct-keys' },
	{ _id: 'u-merge-array-string', username: 'merge-array-string' },
	{ _id: 'u-unset-loss', username: 'unset-loss' },
	{ _id: 'u-unset-none', username: 'unset-none' },
	{ _id: 'u-loss-values', username: 'loss-values' },
	{ _id: 'u-loss-key', username: 'loss-key' },
	{ _id: 'u-gain-values', username: 'gain-values' },
	{ _id: 'u-order-only', username: 'order-only' },
	{ _id: 'u-merge-ldap-dup', username: 'merge-ldap-dup' },
	{ _id: 'u-immutability', username: 'immutability' },
	{ _id: 'u-loss', username: 'lossy' },
	{ _id: 'u-key-loss', username: 'keyloss' },
	{ _id: 'u-growth', username: 'growth' },
	{ _id: 'u-extra-room-key', username: 'extrakey' },
	{ _id: 'u-empty', username: 'empty' },
	{ _id: 'u-lose-unrelated', username: 'unrelated' },
];

const staticTestUsers: IUser[] = staticUserDefinitions.map(({ _id, username }) => ({
	_id,
	username,
	roles: [],
	type: 'user',
	active: true,
	createdAt: new Date(0),
	_updatedAt: new Date(0),
	__rooms: [],
})) as IUser[];

const staticUserIds = staticTestUsers.map(({ _id }) => _id);
const staticUserBaseMap = Object.fromEntries(staticTestUsers.map((user) => [user._id, { ...user }])) as Record<string, IUser>;

const getStaticUser = (_id: string, overrides: Partial<IUser> = {}): IUser => {
	const base = staticUserBaseMap[_id];
	if (!base) {
		throw new Error(`Unknown static user ${_id}`);
	}
	return {
		...base,
		...overrides,
		_id: base._id,
		username: overrides.username ?? base.username,
		__rooms: overrides.__rooms ?? base.__rooms ?? [],
	};
};

type StaticUserUpdate = Partial<IUser> & { _id: string };

const service = new AbacService();

let db: Db;
let sharedMongo: SharedMongoConnection;
let roomsCol: Collection<any>;
let usersCol: Collection<IUser>;

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

const configureStaticUsers = async (users: StaticUserUpdate[]) => {
	if (!usersCol) {
		throw new Error('users collection not initialized');
	}

	const operations = users.map(({ _id, ...fields }) => {
		const update: { $set: Record<string, any>; $unset?: Record<string, 1> } = {
			$set: { _updatedAt: new Date() },
		};

		for (const [key, value] of Object.entries(fields)) {
			if (key === 'abacAttributes') {
				if (value === undefined) {
					update.$unset = { ...(update.$unset || {}), abacAttributes: 1 };
				} else {
					update.$set.abacAttributes = value;
				}
				continue;
			}
			if (key === '__rooms') {
				update.$set.__rooms = value ?? [];
				continue;
			}
			update.$set[key] = value;
		}

		return {
			updateOne: {
				filter: { _id },
				update,
			},
		};
	});

	await usersCol.bulkWrite(operations);
};

const makeLdapEntry = makeLdap; // preserve existing helper naming intent

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

describe('Subject Attributes validation', () => {
	beforeAll(async () => {
		sharedMongo = await acquireSharedInMemoryMongo(SHARED_ABAC_TEST_DB);
		db = sharedMongo.db;

		roomsCol = db.collection('rocketchat_room');
		usersCol = db.collection('users');

		await usersCol.deleteMany({ _id: { $in: staticUserIds } });
		await usersCol.insertMany(staticTestUsers);
	}, 30_000);

	afterAll(async () => {
		await usersCol.deleteMany({ _id: { $in: staticUserIds } });
		await sharedMongo.release();
	});

	beforeEach(async () => {
		await resetStaticUsers();
		await roomsCol.deleteMany({});
	});

	describe('AbacService.addSubjectAttributes (unit)', () => {
		describe('early returns and no-ops', () => {
			it('returns early when user has no _id', async () => {
				const user = makeUser({ _id: undefined });
				await service.addSubjectAttributes(user, makeLdap(), { group: 'dept' });
				const found = await Users.findOne({ username: user.username });
				expect(found).toBeFalsy();
			});

			it('does nothing (no update) when map produces no attributes and user had none', async () => {
				const userId = 'u-no-map-attrs';
				await configureStaticUsers([{ _id: userId, abacAttributes: undefined }]);
				const user = getStaticUser(userId);
				const ldap = makeLdapEntry({ group: '' });
				await service.addSubjectAttributes(user, ldap, { group: 'dept' });
				const updated = await Users.findOneById(userId, { projection: { abacAttributes: 1 } });
				expect(updated).toBeTruthy();
				expect(updated?.abacAttributes ?? undefined).toBeUndefined();
			});
		});

		describe('building and setting attributes', () => {
			it('merges multiple LDAP keys mapping to the same ABAC key, deduplicating values', async () => {
				const userId = 'u-merge-memberof';
				await configureStaticUsers([{ _id: userId }]);
				const user = getStaticUser(userId);
				const ldap = makeLdapEntry({
					memberOf: ['eng', 'sales', 'eng'],
					department: ['sales', 'support'],
				});
				const map = { memberOf: 'dept', department: 'dept' };
				await service.addSubjectAttributes(user, ldap, map);
				const updated = await Users.findOneById(userId, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([{ key: 'dept', values: ['eng', 'sales', 'support'] }]);
			});

			it('creates distinct ABAC attributes for different mapped keys preserving insertion order', async () => {
				const userId = 'u-distinct-keys';
				await configureStaticUsers([{ _id: userId }]);
				const user = getStaticUser(userId);
				const ldap = makeLdapEntry({
					groups: ['alpha', 'beta'],
					regionCodes: ['emea', 'apac'],
					role: 'admin',
				});
				const map = { groups: 'team', regionCodes: 'region', role: 'role' };
				await service.addSubjectAttributes(user, ldap, map);
				const updated = await Users.findOneById(userId, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([
					{ key: 'team', values: ['alpha', 'beta'] },
					{ key: 'region', values: ['emea', 'apac'] },
					{ key: 'role', values: ['admin'] },
				]);
			});

			it('merges array and string LDAP values into one attribute', async () => {
				const userId = 'u-merge-array-string';
				await configureStaticUsers([{ _id: userId }]);
				const user = getStaticUser(userId);
				const ldap = makeLdapEntry({ deptCode: 'eng', deptName: ['engineering', 'eng'] });
				const map = { deptCode: 'dept', deptName: 'dept' };
				await service.addSubjectAttributes(user, ldap, map);
				const updated = await Users.findOneById(userId, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([{ key: 'dept', values: ['eng', 'engineering'] }]);
			});
		});

		describe('unsetting attributes when none extracted', () => {
			it('unsets abacAttributes when user previously had attributes but now extracts none', async () => {
				const userId = 'u-unset-loss';
				await configureStaticUsers([{ _id: userId, abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] }]);
				const user = getStaticUser(userId, { abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });
				const ldap = makeLdapEntry({ other: ['x'] });
				const map = { missing: 'dept' };
				await service.addSubjectAttributes(user, ldap, map);
				const updated = await Users.findOneById(userId, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toBeUndefined();
			});

			it('does not unset when user had no prior attributes and extraction yields none', async () => {
				const userId = 'u-unset-none';
				await configureStaticUsers([{ _id: userId, abacAttributes: [] }]);
				const user = getStaticUser(userId, { abacAttributes: [] });
				const ldap = makeLdapEntry({});
				const map = { missing: 'dept' };
				await service.addSubjectAttributes(user, ldap, map);
				const updated = await Users.findOneById(userId, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([]);
			});
		});

		describe('loss detection triggering hook (attribute changes)', () => {
			it('updates attributes reducing values on loss', async () => {
				const userId = 'u-loss-values';
				await configureStaticUsers([{ _id: userId, abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }] }]);
				const user = getStaticUser(userId, { abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }] });
				const ldap = makeLdapEntry({ memberOf: ['eng'] });
				await service.addSubjectAttributes(user, ldap, { memberOf: 'dept' });
				const updated = await Users.findOneById(userId, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([{ key: 'dept', values: ['eng'] }]);
			});

			it('updates attributes removing an entire key', async () => {
				const userId = 'u-loss-key';
				await configureStaticUsers([
					{
						_id: userId,
						abacAttributes: [
							{ key: 'dept', values: ['eng'] },
							{ key: 'region', values: ['emea'] },
						],
					},
				]);
				const user = getStaticUser(userId, {
					abacAttributes: [
						{ key: 'dept', values: ['eng'] },
						{ key: 'region', values: ['emea'] },
					],
				});
				const ldap = makeLdapEntry({ department: ['eng'] });
				await service.addSubjectAttributes(user, ldap, { department: 'dept' });
				const updated = await Users.findOneById(userId, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([{ key: 'dept', values: ['eng'] }]);
			});

			it('gains new values without triggering loss logic', async () => {
				const userId = 'u-gain-values';
				await configureStaticUsers([{ _id: userId, abacAttributes: [{ key: 'dept', values: ['eng'] }] }]);
				const user = getStaticUser(userId, { abacAttributes: [{ key: 'dept', values: ['eng'] }] });
				const ldap = makeLdapEntry({ memberOf: ['eng', 'qa'] });
				await service.addSubjectAttributes(user, ldap, { memberOf: 'dept' });
				const updated = await Users.findOneById(userId, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([{ key: 'dept', values: ['eng', 'qa'] }]);
			});

			it('keeps attributes unchanged when only ordering differs', async () => {
				const userId = 'u-order-only';
				await configureStaticUsers([{ _id: userId, abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }] }]);
				const user = getStaticUser(userId, { abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }] });
				const ldap = makeLdapEntry({ memberOf: ['qa', 'eng'] });
				await service.addSubjectAttributes(user, ldap, { memberOf: 'dept' });
				const updated = await Users.findOneById(userId, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes?.[0].key).toBe('dept');
				expect(new Set(updated?.abacAttributes?.[0].values)).toEqual(new Set(['eng', 'qa']));
			});

			it('merges duplicate LDAP mapping keys retaining union of values', async () => {
				const userId = 'u-merge-ldap-dup';
				await configureStaticUsers([{ _id: userId, abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] }]);
				const user = getStaticUser(userId, { abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] });
				const ldap = makeLdapEntry({ deptA: ['eng', 'sales'], deptB: ['eng'] });
				await service.addSubjectAttributes(user, ldap, { deptA: 'dept', deptB: 'dept' });
				const updated = await Users.findOneById(userId, { projection: { abacAttributes: 1 } });
				expect(updated?.abacAttributes).toEqual([{ key: 'dept', values: ['eng', 'sales'] }]);
			});
		});

		describe('input immutability', () => {
			let sharedUser: IUser;
			let original: IAbacAttributeDefinition[];
			let clone: IAbacAttributeDefinition[];

			beforeAll(() => {
				original = [{ key: 'dept', values: ['eng', 'sales'] }] as IAbacAttributeDefinition[];
				clone = JSON.parse(JSON.stringify(original));
			});

			beforeEach(async () => {
				await configureStaticUsers([{ _id: 'u-immutability', abacAttributes: original }]);
				sharedUser = getStaticUser('u-immutability', { abacAttributes: original });
			});

			it('does not mutate original user.abacAttributes array reference contents', async () => {
				const ldap = makeLdapEntry({ memberOf: ['eng', 'sales', 'support'] });
				await service.addSubjectAttributes(sharedUser, ldap, { memberOf: 'dept' });
				expect(original).toEqual(clone);
			});
		});
	});

	describe('AbacService.addSubjectAttributes (room removals)', () => {
		const originalCoreServices = jest.requireMock('@rocket.chat/core-services');
		originalCoreServices.Room.removeUserFromRoom = async (rid: string, user: IUser) => {
			await usersCol.updateOne({ _id: user._id }, { $pull: { __rooms: rid } });
		};

		it('removes user from rooms whose attributes become non-compliant after losing a value', async () => {
			const userId = 'u-loss';
			const user = getStaticUser(userId, {
				abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }],
				__rooms: ['rKeep', 'rRemove'],
			});
			await configureStaticUsers([{ _id: userId, abacAttributes: user.abacAttributes, __rooms: user.__rooms }]);

			await insertRooms([
				{ _id: 'rKeep', abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'rRemove', abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }] },
			]);

			const ldap: ILDAPEntry = {
				memberOf: ['eng'],
				_raw: {},
			};

			await service.addSubjectAttributes(user, ldap, { memberOf: 'dept' });

			const updatedUser = await usersCol.findOne({ _id: userId }, { projection: { abacAttributes: 1, __rooms: 1 } });
			expect(updatedUser?.abacAttributes).toEqual([{ key: 'dept', values: ['eng'] }]);
			expect(updatedUser?.abacAttributes).not.toEqual(user.abacAttributes);
			expect(updatedUser?.__rooms?.sort()).toEqual(['rKeep']);
		});

		it('removes user from rooms containing attribute keys they no longer possess (key loss)', async () => {
			const userId = 'u-key-loss';
			const user = getStaticUser(userId, {
				abacAttributes: [
					{ key: 'dept', values: ['eng'] },
					{ key: 'region', values: ['emea'] },
				],
				__rooms: ['rDeptOnly', 'rRegionOnly', 'rBoth'],
			});
			await configureStaticUsers([{ _id: userId, abacAttributes: user.abacAttributes, __rooms: user.__rooms }]);

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

			const ldap: ILDAPEntry = {
				department: ['eng'],
				_raw: {},
			};

			await service.addSubjectAttributes(user, ldap, { department: 'dept' });

			const updatedUser = await usersCol.findOne({ _id: userId }, { projection: { abacAttributes: 1, __rooms: 1 } });
			expect(updatedUser?.abacAttributes).toEqual([{ key: 'dept', values: ['eng'] }]);
			expect(updatedUser?.abacAttributes).not.toEqual(user.abacAttributes);
			expect(updatedUser?.__rooms).toEqual(['rDeptOnly']);
		});

		it('does not remove user from any room when attribute values only grow (gain without loss)', async () => {
			const userId = 'u-growth';
			const user = getStaticUser(userId, {
				abacAttributes: [{ key: 'dept', values: ['eng'] }],
				__rooms: ['rGrowthA', 'rGrowthB'],
			});
			await configureStaticUsers([{ _id: userId, abacAttributes: user.abacAttributes, __rooms: user.__rooms }]);

			await insertRooms([
				{ _id: 'rGrowthA', abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'rGrowthB', abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }] },
			]);

			const ldap: ILDAPEntry = {
				memberOf: ['eng', 'qa'],
				_raw: {},
			};

			await service.addSubjectAttributes(user, ldap, { memberOf: 'dept' });

			const updatedUser = await usersCol.findOne({ _id: userId }, { projection: { abacAttributes: 1, __rooms: 1 } });
			expect(updatedUser?.abacAttributes).toEqual([{ key: 'dept', values: ['eng', 'qa'] }]);
			expect(updatedUser?.__rooms?.sort()).toEqual(['rGrowthA', 'rGrowthB']);
		});

		it('removes user from rooms having attribute keys not present in new attribute set (extra keys in room)', async () => {
			const userId = 'u-extra-room-key';
			const user = getStaticUser(userId, {
				abacAttributes: [
					{ key: 'dept', values: ['eng', 'sales'] },
					{ key: 'otherKey', values: ['value'] },
				],
				__rooms: ['rExtraKeyRoom', 'rBaseline'],
			});
			await configureStaticUsers([{ _id: userId, abacAttributes: user.abacAttributes, __rooms: user.__rooms }]);

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

			const ldap: ILDAPEntry = {
				deptCodes: ['eng', 'sales'],
				_raw: {},
			};

			await service.addSubjectAttributes(user, ldap, { deptCodes: 'dept' });

			const updatedUser = await usersCol.findOne({ _id: userId }, { projection: { abacAttributes: 1, __rooms: 1 } });
			expect(updatedUser?.abacAttributes).toEqual([{ key: 'dept', values: ['eng', 'sales'] }]);
			expect(updatedUser?.__rooms?.sort()).toEqual(['rBaseline']);
		});

		it('unsets attributes and removes user from all ABAC rooms when no LDAP values extracted', async () => {
			const userId = 'u-empty';
			const user = getStaticUser(userId, {
				abacAttributes: [{ key: 'dept', values: ['eng'] }],
				__rooms: ['rAny1', 'rAny2'],
			});
			await configureStaticUsers([{ _id: userId, abacAttributes: user.abacAttributes, __rooms: user.__rooms }]);

			await insertRooms([
				{ _id: 'rAny1', abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'rAny2', abacAttributes: [{ key: 'dept', values: ['eng', 'qa'] }] },
			]);

			const ldap: ILDAPEntry = {
				unrelated: ['x'],
				_raw: {},
			};

			await service.addSubjectAttributes(user, ldap, { missing: 'dept' });

			const updatedUser = await usersCol.findOne({ _id: userId }, { projection: { abacAttributes: 1, __rooms: 1 } });
			expect(updatedUser?.abacAttributes).toBeUndefined();
			expect(updatedUser?.abacAttributes).not.toEqual(user.abacAttributes);
			expect(updatedUser?.__rooms).toEqual([]);
		});

		it('does not remove user from room when losing attribute not used by room (hook runs but no change)', async () => {
			const userId = 'u-lose-unrelated';
			const user = getStaticUser(userId, {
				abacAttributes: [
					{ key: 'dept', values: ['eng'] },
					{ key: 'region', values: ['emea'] },
					{ key: 'project', values: ['X'] },
				],
				__rooms: ['rDeptRegion'],
			});
			await configureStaticUsers([{ _id: userId, abacAttributes: user.abacAttributes, __rooms: user.__rooms }]);

			await insertRooms([
				{
					_id: 'rDeptRegion',
					abacAttributes: [
						{ key: 'dept', values: ['eng'] },
						{ key: 'region', values: ['emea'] },
					],
				},
			]);

			const ldap: ILDAPEntry = {
				department: ['eng', 'ceo'],
				regionCodes: ['emea', 'apac'],
				_raw: {},
			};

			await service.addSubjectAttributes(user, ldap, { department: 'dept', regionCodes: 'region', projectCodes: 'project' });

			const updatedUser = await usersCol.findOne({ _id: userId }, { projection: { abacAttributes: 1, __rooms: 1 } });
			expect(updatedUser?.abacAttributes).toEqual([
				{ key: 'dept', values: ['eng', 'ceo'] },
				{ key: 'region', values: ['emea', 'apac'] },
			]);
			expect(updatedUser?.abacAttributes).not.toEqual(user.abacAttributes);
			expect(updatedUser?.__rooms).toEqual(['rDeptRegion']);
		});
	});
});
