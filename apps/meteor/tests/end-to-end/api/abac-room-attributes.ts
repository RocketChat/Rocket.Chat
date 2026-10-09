import type { Credentials } from '@rocket.chat/api-client';
import type { IMessage, IPermission, IRoom, ISetting, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import { MongoClient } from 'mongodb';

import { addAbacAttributesToUserDirectly } from '../../data/abac.helper';
import { api, credentials, getCredentials, request } from '../../data/api-data';
import { sleep } from '../../data/livechat/utils';
import { getSettingValueById, updatePermission, updateSetting } from '../../data/permissions.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE, URL_MONGODB } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[ABAC Room Attributes] (Enterprise Only)', function () {
	this.retries(0);

	const v1 = '/api/v1';
	const SETTLE_MS = 500;
	const suffix = Date.now();

	const dept = `ra-dept-${suffix}`;

	const savedPermissionId = 'edit-room-abac-attributes';
	let savedPermissionRoles: string[] = [];
	const settingIds = ['ABAC_Enabled', 'ABAC_Restrict_To_Owned_Attributes', 'ABAC_Enforce_All_Rooms'];
	const savedSettings = new Map<string, ISetting['value']>();

	const createdUsers: IUser[] = [];
	const createdRoomIds: IRoom['_id'][] = [];

	let adminId: IUser['_id'];
	let owner: IUser;
	let ownerCredentials: Credentials;
	let member: IUser;
	let memberCredentials: Credentials;
	let removable: IUser[];

	let ownedRoomId: IRoom['_id'];
	let otherRoomId: IRoom['_id'];
	let connection: MongoClient;

	const setSetting = async (id: string, value: ISetting['value']) => {
		await updateSetting(id, value);
		await sleep(SETTLE_MS);
	};

	const getPermissionRoles = async (id: string): Promise<string[]> => {
		const res = await request.get(api('permissions.listAll')).set(credentials).expect(200);
		return (res.body.update as IPermission[]).find(({ _id }) => _id === id)?.roles ?? [];
	};

	const newUser = async (attributes: string[]) => {
		const user = await createUser();
		createdUsers.push(user);
		await addAbacAttributesToUserDirectly(connection, user._id, [{ key: dept, values: attributes }]);
		return user;
	};

	const createAttributedGroup = async (members: IUser[]) => {
		const res = await request
			.post(api('groups.create'))
			.set(credentials)
			.send({ name: `abac-ra-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, members: members.map(({ username }) => username) })
			.expect(200);
		const rid = res.body.group._id as IRoom['_id'];
		createdRoomIds.push(rid);
		await request
			.post(`${v1}/abac/rooms/${rid}/attributes`)
			.set(credentials)
			.send({ attributes: { [dept]: ['eng'] } })
			.expect(200);
		return rid;
	};

	const writeAttributes = (rid: IRoom['_id'], attributes: Record<string, string[]>, as: Credentials) =>
		request.post(`${v1}/abac/rooms/${rid}/attributes`).set(as).send({ attributes });

	const preview = (body: Record<string, unknown>, as: Credentials = ownerCredentials) =>
		request.post(`${v1}/abac/membership-preview`).set(as).send(body);

	const assignable = (rid: IRoom['_id'], as: Credentials = ownerCredentials) =>
		request.get(`${v1}/abac/assignable-attributes`).query({ rid }).set(as);

	before((done) => getCredentials(done));

	before(async function () {
		this.timeout(30000);

		connection = await MongoClient.connect(URL_MONGODB);

		savedPermissionRoles = await getPermissionRoles(savedPermissionId);
		for (const id of settingIds) {
			savedSettings.set(id, await getSettingValueById(id));
		}

		await setSetting('ABAC_Enabled', true);
		await setSetting('ABAC_Restrict_To_Owned_Attributes', true);
		await setSetting('ABAC_Enforce_All_Rooms', false);
		await request
			.post(`${v1}/abac/attributes`)
			.set(credentials)
			.send({ key: dept, values: ['eng', 'sales', 'ops'] })
			.expect(200);

		adminId = credentials['X-User-Id'];
		await addAbacAttributesToUserDirectly(connection, adminId, [{ key: dept, values: ['eng', 'sales'] }]);

		owner = await newUser(['eng', 'sales']);
		ownerCredentials = await login(owner.username, password);
		member = await newUser(['eng', 'sales']);
		memberCredentials = await login(member.username, password);
		removable = await Promise.all(Array.from({ length: 5 }, () => newUser(['eng'])));

		ownedRoomId = await createAttributedGroup([owner, member, ...removable]);
		await request.post(api('groups.addOwner')).set(credentials).send({ roomId: ownedRoomId, userId: owner._id }).expect(200);

		otherRoomId = await createAttributedGroup([owner, member]);
	});

	after(async function () {
		this.timeout(30000);

		for (const roomId of createdRoomIds) {
			await request.post(api('rooms.delete')).set(credentials).send({ roomId }).expect(200);
		}

		await addAbacAttributesToUserDirectly(connection, adminId, []);
		for (const user of createdUsers) {
			await deleteUser(user);
		}

		const res = await request.get(`${v1}/abac/attributes`).query({ key: dept }).set(credentials).expect(200);
		const attribute = (res.body.attributes as { _id: string; key: string }[]).find((a) => a.key === dept);
		if (attribute) {
			await request.delete(`${v1}/abac/attributes/${attribute._id}`).set(credentials).expect(200);
		}

		await updatePermission(savedPermissionId, savedPermissionRoles);
		for (const [id, value] of savedSettings) {
			await setSetting(id, value);
		}

		await connection.close();
	});

	describe('POST /abac/rooms/:rid/attributes', () => {
		it("lets an owner save their room's attributes", async () => {
			await writeAttributes(ownedRoomId, { [dept]: ['eng'] }, ownerCredentials).expect(200);
		});

		it('refuses the same user on a room they do not own', async () => {
			await writeAttributes(otherRoomId, { [dept]: ['eng'] }, ownerCredentials)
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});

		it('refuses a member who is not an owner', async () => {
			await writeAttributes(ownedRoomId, { [dept]: ['eng'] }, memberCredentials).expect(403);
		});

		it('refuses an owner once the owner role loses the permission', async () => {
			await updatePermission(savedPermissionId, ['admin']);

			try {
				await writeAttributes(ownedRoomId, { [dept]: ['eng'] }, ownerCredentials).expect(403);
			} finally {
				await updatePermission(savedPermissionId, ['admin', 'owner']);
			}
		});

		it('refuses an owner a value they do not hold', async () => {
			await writeAttributes(ownedRoomId, { [dept]: ['eng', 'ops'] }, ownerCredentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('error', 'error-invalid-attribute-values');
				});
		});

		const ownedFreshRoom = async () => {
			const rid = await createAttributedGroup([owner]);
			await request.post(api('groups.addOwner')).set(credentials).send({ roomId: rid, userId: owner._id }).expect(200);
			return rid;
		};

		it('lets an owner remove every attribute while enforcement is off', async () => {
			const rid = await ownedFreshRoom();

			await writeAttributes(rid, {}, ownerCredentials).expect(200);

			const res = await request.get(api('rooms.info')).set(credentials).query({ roomId: rid }).expect(200);
			expect(res.body.room).to.not.have.property('abacAttributes');
		});

		it('refuses an owner removing every attribute while enforcement is on', async () => {
			const rid = await ownedFreshRoom();
			await setSetting('ABAC_Enforce_All_Rooms', true);

			try {
				await writeAttributes(rid, {}, ownerCredentials)
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('error', 'error-abac-room-attributes-cleared');
					});
			} finally {
				await setSetting('ABAC_Enforce_All_Rooms', false);
			}
		});

		it('lets an owner add a value they do not hold once restricting to owned attributes is off', async () => {
			await setSetting('ABAC_Restrict_To_Owned_Attributes', false);

			try {
				const rid = await createAttributedGroup([owner]);
				await request.post(api('groups.addOwner')).set(credentials).send({ roomId: rid, userId: owner._id }).expect(200);

				await writeAttributes(rid, { [dept]: ['eng', 'ops'] }, ownerCredentials).expect(200);
			} finally {
				await setSetting('ABAC_Restrict_To_Owned_Attributes', true);
			}
		});

		it('lets an administrator save any room with any defined value, as before', async () => {
			await writeAttributes(otherRoomId, { [dept]: ['eng'] }, credentials).expect(200);
		});

		it('leaves a room without attributes untouched when an administrator sends none', async () => {
			const res = await request
				.post(api('groups.create'))
				.set(credentials)
				.send({ name: `abac-ra-plain-${Date.now()}` })
				.expect(200);
			const rid = res.body.group._id as IRoom['_id'];
			createdRoomIds.push(rid);

			await writeAttributes(rid, {}, credentials).expect(200);

			const info = await request.get(api('rooms.info')).set(credentials).query({ roomId: rid }).expect(200);
			expect(info.body.room).to.not.have.property('abacAttributes');
		});
	});

	describe('GET /abac/assignable-attributes with a rid', () => {
		it('requires the permission on that room', async () => {
			await assignable(otherRoomId).expect(403);
			await assignable(ownedRoomId, memberCredentials).expect(403);
		});

		const offered = (res: { body: { attributes: { key: string; values: string[] }[] } }) =>
			res.body.attributes.find(({ key }) => key === dept);

		it("offers the room's owner the values they hold and the values the room carries", async () => {
			const res = await assignable(ownedRoomId).expect(200);

			expect(offered(res)).to.deep.equal({ key: dept, values: ['eng', 'sales'] });
		});

		it('offers every defined value once restricting to owned attributes is off', async () => {
			await setSetting('ABAC_Restrict_To_Owned_Attributes', false);

			try {
				const res = await assignable(ownedRoomId).expect(200);

				expect(offered(res)).to.deep.equal({ key: dept, values: ['eng', 'sales', 'ops'] });
			} finally {
				await setSetting('ABAC_Restrict_To_Owned_Attributes', true);
			}
		});

		it('offers an administrator every defined value', async () => {
			const res = await assignable(ownedRoomId, credentials).expect(200);

			expect(offered(res)).to.deep.equal({ key: dept, values: ['eng', 'sales', 'ops'] });
		});
	});

	describe('POST /abac/membership-preview with a rid', () => {
		const adding = { [dept]: ['eng', 'sales'] };
		type PreviewMember = Pick<IUser, '_id' | 'username'> & { verdict: string };
		const losing = (members: PreviewMember[]) => members.filter(({ verdict }) => verdict !== 'compliant');

		it('requires the permission on that room', async () => {
			await preview({ rid: otherRoomId, attributes: adding }).expect(403);
			await preview({ rid: ownedRoomId, attributes: adding }, memberCredentials).expect(403);
		});

		it('refuses an owner a value they do not hold, as the write does', async () => {
			await preview({ rid: ownedRoomId, attributes: { [dept]: ['eng', 'ops'] } })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('error', 'error-invalid-attribute-values');
				});
		});

		it('rejects a page size below one and a malformed cursor', async () => {
			await preview({ rid: ownedRoomId, attributes: adding, count: 0 }).expect(400);
			await preview({ rid: ownedRoomId, attributes: adding, after: { username: 'someone' } }).expect(400);
		});

		it('pages through every member by the last one checked, each with its verdict', async () => {
			const page = (after?: unknown) => preview({ rid: ownedRoomId, attributes: adding, count: 3, after }).expect(200);

			const first = await page();
			const second = await page(first.body.next);
			const third = await page(second.body.next);
			const members = [first, second, third].flatMap((res) => res.body.members as PreviewMember[]);

			expect(first.body.editor).to.equal('compliant');
			expect([first, second, third].map((res) => res.body.count)).to.deep.equal([3, 3, 2]);
			expect([first, second, third].map((res) => res.body.checked)).to.deep.equal([3, 3, 2]);
			expect(first.body.total).to.equal(8);
			expect(second.body).to.not.have.property('total');
			expect(third.body).to.not.have.property('next');
			expect(members).to.have.lengthOf(8);
			expect(losing(members).map(({ _id }) => _id)).to.have.members(removable.map(({ _id }) => _id));
		});

		it('returns every member of one group among the members it checked, even past the count asked for', async () => {
			const loses = await preview({ rid: ownedRoomId, attributes: adding, count: 2, group: 'loses' }).expect(200);

			expect(loses.body.count).to.equal(removable.length);
			expect(loses.body.checked).to.equal(loses.body.total);
			expect(loses.body).to.not.have.property('next');
			expect((loses.body.members as PreviewMember[]).map(({ _id }) => _id)).to.have.members(removable.map(({ _id }) => _id));

			const retains = await preview({ rid: ownedRoomId, attributes: adding, group: 'retains' }).expect(200);
			expect((retains.body.members as PreviewMember[]).map(({ _id }) => _id)).to.have.members([adminId, owner._id, member._id]);
		});

		it("lists each member's room roles, and none for a member without any", async () => {
			const res = await preview({ rid: ownedRoomId, attributes: adding, group: 'retains' }).expect(200);
			const byId = new Map((res.body.members as (PreviewMember & { roles?: string[] })[]).map((m) => [m._id, m]));

			expect(byId.get(owner._id)?.roles).to.include('owner');
			expect(byId.get(member._id)).to.not.have.property('roles');
		});

		it('searches the members by username', async () => {
			const [target] = removable;
			const res = await preview({ rid: ownedRoomId, attributes: adding, filter: target.username }).expect(200);

			expect(res.body.members).to.have.lengthOf(1);
			expect(res.body.members[0]).to.include({ username: target.username, verdict: 'nonCompliant' });
		});

		it('reports nobody losing access when the change adds nothing', async () => {
			const res = await preview({ rid: ownedRoomId, attributes: { [dept]: ['eng'] } }).expect(200);

			expect(losing(res.body.members)).to.have.lengthOf(0);
		});

		it('removes exactly the members it reported, and posts one message that names nobody', async () => {
			const answer = await preview({ rid: ownedRoomId, attributes: adding, count: 10 }).expect(200);
			const reported = losing(answer.body.members);
			expect(reported).to.have.lengthOf(5);

			await writeAttributes(ownedRoomId, adding, ownerCredentials).expect(200);

			const members = await request.get(api('groups.members')).set(credentials).query({ roomId: ownedRoomId }).expect(200);
			const remaining = (members.body.members as IUser[]).map(({ username }) => username);
			for (const { username } of reported) {
				expect(remaining).to.not.include(username);
			}
			expect(members.body.total).to.equal(3);

			const history = await request.get(api('groups.history')).set(credentials).query({ roomId: ownedRoomId, count: 50 }).expect(200);
			const messages = history.body.messages as IMessage[];
			const summaries = messages.filter(({ t }) => t === 'abac-removed-users-from-room');
			expect(summaries).to.have.lengthOf(1);
			expect(summaries[0].msg).to.equal('5');
			expect(summaries[0].u._id).to.equal(owner._id);
			expect(messages.filter(({ t }) => t === 'abac-removed-user-from-room')).to.have.lengthOf(0);
		});
	});
});
