import type { IAbacAttributeDefinition, IRoom, IUser } from '@rocket.chat/core-typings';
import type { Collection, Db } from 'mongodb';

import { Audit } from './audit';
import { AbacService } from './index';
import { logger } from './logger';
import { acquireSharedInMemoryMongo, SHARED_ABAC_TEST_DB, type SharedMongoConnection } from './test-helpers/mongoMemoryServer';

jest.mock('@rocket.chat/core-services', () => ({
	ServiceClass: class {
		onSettingChanged = jest.fn();
	},
	Room: { removeUserFromRoom: jest.fn() },
}));

type UserSeed = {
	_id: string;
	username?: string;
	name?: string;
	abacAttributes?: IAbacAttributeDefinition[];
	active?: boolean;
	rid?: string;
	rolePriority?: number;
};

describe('AbacService.dryRunRoomAttributes (LocalPDP)', () => {
	let sharedMongo: SharedMongoConnection;
	let db: Db;
	let roomsCol: Collection<IRoom>;
	let usersCol: Collection<IUser>;

	const service = new AbacService();
	service.setPdpStrategy('local');

	const actor = { _id: 'test-user', username: 'testuser', type: 'user' };

	const addDef = (key: string, values: string[]) =>
		service.addAbacAttribute({ key, values }, actor).catch((e: any) => {
			if (e?.message !== 'error-duplicate-attribute-key') throw e;
		});

	const seedRoom = async () => {
		const rid = `r-dr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
		await roomsCol.insertOne({ _id: rid, t: 'p', name: rid } as any);
		return rid;
	};

	const seedUsers = (users: UserSeed[]) =>
		usersCol.insertMany(
			users.map((u) => ({
				_id: u._id,
				username: u.username ?? u._id,
				type: 'user',
				roles: [],
				active: u.active ?? true,
				createdAt: new Date(),
				_updatedAt: new Date(),
				__rooms: u.rid ? [u.rid] : [],
				...(u.name !== undefined && { name: u.name }),
				...(u.abacAttributes && { abacAttributes: u.abacAttributes }),
				...(u.rolePriority !== undefined && u.rid && { roomRolePriorities: { [u.rid]: u.rolePriority } }),
			})) as IUser[],
		);

	beforeAll(async () => {
		sharedMongo = await acquireSharedInMemoryMongo(SHARED_ABAC_TEST_DB);
		db = sharedMongo.db;
		jest.spyOn(logger, 'debug').mockImplementation(() => undefined);
		jest.spyOn(Audit, 'actionPerformed').mockResolvedValue();
		roomsCol = db.collection<IRoom>('rocketchat_room');
		usersCol = db.collection<IUser>('users');
	}, 30_000);

	afterAll(() => sharedMongo.release());

	afterEach(async () => {
		await usersCol.deleteMany({ _id: /^dr_/ });
		await roomsCol.deleteMany({ _id: /^r-dr/ });
	});

	describe('compliance', () => {
		let rid: string;

		beforeEach(async () => {
			rid = await seedRoom();
			await addDef('dept', ['eng', 'sales', 'hr']);
			await addDef('region', ['emea', 'apac']);
			await seedUsers([
				{ _id: 'dr_exact', rid, abacAttributes: [{ key: 'dept', values: ['eng', 'sales'] }] },
				{ _id: 'dr_superset', rid, abacAttributes: [{ key: 'dept', values: ['eng', 'sales', 'hr'] }] },
				{ _id: 'dr_partial', rid, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'dr_wrong_key', rid, abacAttributes: [{ key: 'region', values: ['emea'] }] },
				{ _id: 'dr_no_attrs', rid },
			]);
		});

		it('grants compliance on exact match or superset, denies otherwise', async () => {
			const { members, compliantCount, nonCompliantCount } = await service.dryRunRoomAttributes(rid, { dept: ['eng', 'sales'] }, actor);

			const byId = Object.fromEntries(members.map((m) => [m._id, m.compliant]));
			expect(byId).toEqual({
				dr_exact: true,
				dr_superset: true,
				dr_partial: false,
				dr_wrong_key: false,
				dr_no_attrs: false,
			});
			expect(compliantCount).toBe(2);
			expect(nonCompliantCount).toBe(3);
		});

		it('enforces AND semantics across multiple keys', async () => {
			await usersCol.updateOne(
				{ _id: 'dr_exact' },
				{
					$set: {
						abacAttributes: [
							{ key: 'dept', values: ['eng'] },
							{ key: 'region', values: ['emea'] },
						],
					},
				},
			);
			await usersCol.updateOne({ _id: 'dr_partial' }, { $set: { abacAttributes: [{ key: 'dept', values: ['eng'] }] } });

			const { members } = await service.dryRunRoomAttributes(rid, { dept: ['eng'], region: ['emea'] }, actor);
			const byId = Object.fromEntries(members.map((m) => [m._id, m.compliant]));

			expect(byId.dr_exact).toBe(true);
			expect(byId.dr_partial).toBe(false);
		});
	});

	describe('member filtering', () => {
		it('includes only active users that belong to the room', async () => {
			const rid = await seedRoom();
			const otherRid = await seedRoom();
			await addDef('dept', ['eng']);
			await seedUsers([
				{ _id: 'dr_in', rid, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'dr_inactive', rid, active: false, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'dr_elsewhere', rid: otherRid, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
			]);

			const { members } = await service.dryRunRoomAttributes(rid, { dept: ['eng'] }, actor);

			expect(members.map((m) => m._id)).toEqual(['dr_in']);
		});
	});

	describe('sorting', () => {
		it('groups by compliance (non-compliant first) and sorts by name within each group', async () => {
			const rid = await seedRoom();
			await addDef('dept', ['eng']);
			await seedUsers([
				{ _id: 'dr_c_alice', username: 'u1', name: 'Alice', rid, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'dr_c_charlie', username: 'u3', name: 'Charlie', rid, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'dr_c_bob', username: 'u2', name: 'Bob', rid, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'dr_nc_zoe', username: 'u5', name: 'Zoe', rid, abacAttributes: [{ key: 'dept', values: ['sales'] }] },
				{ _id: 'dr_nc_xavier', username: 'u4', name: 'Xavier', rid, abacAttributes: [{ key: 'dept', values: ['sales'] }] },
			]);

			const { members } = await service.dryRunRoomAttributes(rid, { dept: ['eng'] }, actor);

			expect(members.map((m) => m._id)).toEqual(['dr_nc_xavier', 'dr_nc_zoe', 'dr_c_alice', 'dr_c_bob', 'dr_c_charlie']);
		});

		it('falls back to username when name is missing', async () => {
			const rid = await seedRoom();
			await addDef('dept', ['eng']);
			await seedUsers([
				{ _id: 'dr_named', username: 'zzz', name: 'aaa', rid, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'dr_nameless', username: 'bbb', rid, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
			]);

			const { members } = await service.dryRunRoomAttributes(rid, { dept: ['eng'] }, actor);

			expect(members.map((m) => m._id)).toEqual(['dr_named', 'dr_nameless']);
		});
	});

	describe('response shape', () => {
		it('exposes rolePriority mapped from user roomRolePriorities with default fallback', async () => {
			const rid = await seedRoom();
			await addDef('dept', ['eng']);
			await seedUsers([
				{ _id: 'dr_owner', rid, rolePriority: 0, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'dr_leader', rid, rolePriority: 250, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'dr_mod', rid, rolePriority: 500, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
				{ _id: 'dr_default', rid, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
			]);

			const { members, total } = await service.dryRunRoomAttributes(rid, { dept: ['eng'] }, actor);
			const byId = Object.fromEntries(members.map((m) => [m._id, m.rolePriority]));

			expect(total).toBe(4);
			expect(byId).toEqual({ dr_owner: 0, dr_leader: 250, dr_mod: 500, dr_default: 10000 });
		});

		it('treats empty attribute payload as all compliant', async () => {
			const rid = await seedRoom();
			await seedUsers([
				{ _id: 'dr_any1', rid },
				{ _id: 'dr_any2', rid, abacAttributes: [{ key: 'dept', values: ['eng'] }] },
			]);

			const result = await service.dryRunRoomAttributes(rid, {}, actor);

			expect(result).toMatchObject({ total: 2, compliantCount: 2, nonCompliantCount: 0 });
		});

		it('returns empty result for room with no members', async () => {
			const rid = await seedRoom();

			const result = await service.dryRunRoomAttributes(rid, {}, actor);

			expect(result).toMatchObject({ total: 0, members: [] });
		});
	});

	describe('side effects', () => {
		it('leaves room attributes and membership unchanged', async () => {
			const rid = await seedRoom();
			await addDef('dept', ['eng']);
			await seedUsers([{ _id: 'dr_victim', rid, abacAttributes: [{ key: 'dept', values: ['sales'] }] }]);

			await service.dryRunRoomAttributes(rid, { dept: ['eng'] }, actor);

			const [room, user] = await Promise.all([
				roomsCol.findOne({ _id: rid }),
				usersCol.findOne({ _id: 'dr_victim' }, { projection: { __rooms: 1 } }),
			]);
			expect(room?.abacAttributes).toBeFalsy();
			expect(user?.__rooms).toContain(rid);
		});
	});

	describe('validation', () => {
		it.each([
			['invalid key format', { 'bad key!': ['v'] }],
			['unknown attribute definition', { undefined_key: ['v'] }],
		])('rejects %s', async (_label, attributes) => {
			const rid = await seedRoom();

			await expect(service.dryRunRoomAttributes(rid, attributes, actor)).rejects.toThrow();
		});

		it('rejects missing room', async () => {
			await expect(service.dryRunRoomAttributes('nonexistent-room', {}, actor)).rejects.toThrow();
		});
	});
});
