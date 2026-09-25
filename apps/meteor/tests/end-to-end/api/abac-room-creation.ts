import type { Credentials } from '@rocket.chat/api-client';
import type { IPermission, IRoom, ISetting, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, beforeEach, describe, it } from 'mocha';

import { addAbacAttributesToUserDirectly } from '../../data/abac.helper';
import { api, credentials, getCredentials, request } from '../../data/api-data';
import { sleep } from '../../data/livechat/utils';
import { getSettingValueById, updatePermission, updateSetting } from '../../data/permissions.helper';
import { deleteTeam } from '../../data/teams.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[ABAC Room Creation] (Enterprise Only)', function () {
	this.retries(0);

	const v1 = '/api/v1';
	const SETTLE_MS = 500;
	const suffix = Date.now();

	const dept = `rc-dept-${suffix}`;
	const clearance = `rc-clearance-${suffix}`;

	const settingIds = ['ABAC_Enabled', 'ABAC_Enforce_All_Rooms', 'ABAC_Required_Attributes', 'ABAC_Restrict_To_Owned_Attributes'];
	const permissionIds = ['create-abac-managed-room', 'bypass-abac-store-validation'];
	const savedSettings = new Map<string, ISetting['value']>();
	const savedPermissions = new Map<string, string[]>();

	const createdRoomIds: IRoom['_id'][] = [];
	const createdTeamNames: string[] = [];

	let adminId: IUser['_id'];
	let creator: IUser;
	let creatorCredentials: Credentials;
	let unattributedUser: IUser;

	const setSetting = async (id: string, value: ISetting['value']) => {
		await updateSetting(id, value);
		await sleep(SETTLE_MS);
	};

	const getPermissionRoles = async (id: string): Promise<string[]> => {
		const res = await request.get(api('permissions.listAll')).set(credentials).expect(200);
		return (res.body.update as IPermission[]).find(({ _id }) => _id === id)?.roles ?? [];
	};

	const createGroup = (body: Record<string, unknown>, as: Credentials = credentials) =>
		request
			.post(api('groups.create'))
			.set(as)
			.send({ name: `abac-rc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...body });

	const track = (roomId?: IRoom['_id']) => roomId && createdRoomIds.push(roomId);

	before((done) => getCredentials(done));

	before(async function () {
		this.timeout(20000);

		for (const id of settingIds) {
			savedSettings.set(id, await getSettingValueById(id));
		}
		for (const id of permissionIds) {
			savedPermissions.set(id, await getPermissionRoles(id));
		}

		await setSetting('ABAC_Enabled', true);

		await request
			.post(`${v1}/abac/attributes`)
			.set(credentials)
			.send({ key: dept, values: ['eng', 'sales', 'ops'] })
			.expect(200);
		await request
			.post(`${v1}/abac/attributes`)
			.set(credentials)
			.send({ key: clearance, values: ['secret'] })
			.expect(200);

		adminId = credentials['X-User-Id'];
		await addAbacAttributesToUserDirectly(adminId, [
			{ key: dept, values: ['eng', 'sales'] },
			{ key: clearance, values: ['secret'] },
		]);

		creator = await createUser();
		creatorCredentials = await login(creator.username, password);
		await addAbacAttributesToUserDirectly(creator._id, [{ key: dept, values: ['eng'] }]);

		unattributedUser = await createUser();
	});

	after(async function () {
		this.timeout(30000);

		await setSetting('ABAC_Enforce_All_Rooms', false);

		for (const teamName of createdTeamNames) {
			await deleteTeam(credentials, teamName);
		}
		for (const roomId of createdRoomIds) {
			await request.post(api('rooms.delete')).set(credentials).send({ roomId }).expect(200);
		}

		await addAbacAttributesToUserDirectly(adminId, []);
		await deleteUser(creator);
		await deleteUser(unattributedUser);

		for (const key of [dept, clearance]) {
			const res = await request.get(`${v1}/abac/attributes`).query({ key }).set(credentials).expect(200);
			const attribute = (res.body.attributes as { _id: string; key: string }[]).find((a) => a.key === key);
			if (attribute) {
				await request.delete(`${v1}/abac/attributes/${attribute._id}`).set(credentials).expect(200);
			}
		}

		for (const [id, roles] of savedPermissions) {
			await updatePermission(id, roles);
		}
		for (const [id, value] of savedSettings) {
			await setSetting(id, value);
		}
	});

	describe('a room created with attributes', () => {
		beforeEach(async () => {
			await updatePermission('create-abac-managed-room', ['admin', 'user']);
			await setSetting('ABAC_Restrict_To_Owned_Attributes', true);
		});

		it('is created with the attributes, normalized, by a creator who is not an administrator', async () => {
			const res = await createGroup({ abacAttributes: { [dept]: ['eng'] } }, creatorCredentials).expect(200);
			track(res.body.group._id);

			expect(res.body.group.abacAttributes).to.deep.equal([{ key: dept, values: ['eng'] }]);
			expect(res.body.skippedMembers).to.deep.equal([]);
		});

		it('is refused to a creator without the permission', async () => {
			await updatePermission('create-abac-managed-room', ['admin']);

			await createGroup({ abacAttributes: { [dept]: ['eng'] } }, creatorCredentials)
				.expect(400)
				.expect((res) => {
					expect(res.body.error).to.include('error-abac-attributes-not-allowed');
				});
		});

		it('names the attribute a creator does not hold', async () => {
			await createGroup({ abacAttributes: { [dept]: ['eng', 'sales'] } }, creatorCredentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('errorType', 'error-abac-attribute-not-assignable');
					expect(res.body.details.attributes).to.deep.equal([{ key: dept, values: ['sales'] }]);
				});
		});

		it('admits values the creator does not hold once restricting to owned attributes is off', async () => {
			await setSetting('ABAC_Restrict_To_Owned_Attributes', false);

			const res = await createGroup({ abacAttributes: { [dept]: ['sales'] } }, creatorCredentials).expect(200);
			track(res.body.group._id);
		});

		it('leaves administrator writes through ABAC > Rooms unaffected by restricting to owned attributes', async () => {
			const res = await createGroup({ abacAttributes: { [dept]: ['eng'] } }).expect(200);
			const roomId = res.body.group._id;
			track(roomId);

			await request
				.post(`${v1}/abac/rooms/${roomId}/attributes`)
				.set(credentials)
				.send({ attributes: { [dept]: ['eng', 'ops'] } })
				.expect(200);
		});

		it('is refused an attribute the workspace does not define', async () => {
			await createGroup({ abacAttributes: { [`rc-undefined-${suffix}`]: ['x'] } })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('errorType', 'error-abac-invalid-attributes');
				});
		});

		it('is refused when there is nothing to assign', async () => {
			await createGroup({ abacAttributes: { [dept]: [] } }).expect(400);
			await createGroup({ abacAttributes: {} }).expect(400);
		});

		it('is refused on a public channel, whose request does not accept attributes', async () => {
			await request
				.post(api('channels.create'))
				.set(credentials)
				.send({ name: `abac-rc-public-${Date.now()}`, abacAttributes: { [dept]: ['eng'] } })
				.expect(400);
		});

		it('is refused while ABAC is disabled', async () => {
			await setSetting('ABAC_Enabled', false);

			try {
				await createGroup({ abacAttributes: { [dept]: ['eng'] } })
					.expect(400)
					.expect((res) => {
						expect(res.body.error).to.include('error-abac-not-enabled');
					});
			} finally {
				await setSetting('ABAC_Enabled', true);
			}
		});

		it('skips the members who do not carry the attributes, and says who', async () => {
			const res = await createGroup({
				abacAttributes: { [dept]: ['eng'] },
				members: [creator.username, unattributedUser.username],
			}).expect(200);
			const roomId = res.body.group._id;
			track(roomId);

			expect(res.body.skippedMembers).to.deep.equal([unattributedUser.username]);

			const members = await request.get(api('groups.members')).set(credentials).query({ roomId }).expect(200);
			const usernames = (members.body.members as IUser[]).map(({ username }) => username);
			expect(usernames).to.include(creator.username);
			expect(usernames).to.not.include(unattributedUser.username);
		});

		it('writes the attributes to the audit log', async () => {
			const res = await createGroup({ abacAttributes: { [dept]: ['eng'] } }).expect(200);
			const roomId = res.body.group._id;
			track(roomId);

			type AuditEvent = { t: string; data: Array<{ key: string; value: any }> };
			const findEntry = (events: AuditEvent[]) =>
				events.find(
					(e) =>
						e.t === 'abac.object.attribute.changed' &&
						e.data.some(({ key, value }) => key === 'room' && value?._id === roomId) &&
						e.data.some(({ key, value }) => key === 'change' && value === 'created'),
				);

			let entry: AuditEvent | undefined;
			for (let attempt = 0; attempt < 10 && !entry; attempt++) {
				await sleep(200);
				const audit = await request.get(`${v1}/abac/audit`).set(credentials).query({ count: 100 }).expect(200);
				entry = findEntry(audit.body.events);
			}

			expect(entry, 'creation audit entry').to.exist;
			expect(entry?.data.find(({ key }) => key === 'current')?.value).to.deep.equal([{ key: dept, values: ['eng'] }]);
		});

		describe('by a holder of bypass-abac-store-validation', () => {
			before(async () => {
				await updatePermission('bypass-abac-store-validation', ['user']);
			});

			after(async () => {
				await updatePermission('bypass-abac-store-validation', savedPermissions.get('bypass-abac-store-validation') ?? []);
			});

			it('admits values the creator does not hold, and filters the creator out as a member', async () => {
				const res = await createGroup({ abacAttributes: { [dept]: ['ops'] } }, creatorCredentials).expect(200);
				track(res.body.group._id);

				expect(res.body.skippedMembers).to.deep.equal([creator.username]);
			});
		});
	});

	describe('a team created with attributes', () => {
		before(async () => {
			await updatePermission('create-abac-managed-room', ['admin', 'user']);
			await setSetting('ABAC_Restrict_To_Owned_Attributes', true);
		});

		it('carries the attributes on its main room and keeps team membership in step with the room', async () => {
			const name = `abac-rc-team-${Date.now()}`;
			const res = await request
				.post(api('teams.create'))
				.set(credentials)
				.send({ name, type: 1, members: [creator._id, unattributedUser._id], abacAttributes: { [dept]: ['eng'] } })
				.expect(200);
			createdTeamNames.push(name);

			expect(res.body.skippedMembers).to.deep.equal([unattributedUser.username]);

			const info = await request.get(api('groups.info')).set(credentials).query({ roomId: res.body.team.roomId }).expect(200);
			expect(info.body.group.abacAttributes).to.deep.equal([{ key: dept, values: ['eng'] }]);

			const members = await request.get(api('teams.members')).set(credentials).query({ teamName: name }).expect(200);
			const ids = (members.body.members as Array<{ user: IUser }>).map(({ user }) => user._id);
			expect(ids).to.include(creator._id);
			expect(ids).to.not.include(unattributedUser._id);
		});

		it('is refused when the owner is not the caller', async () => {
			await request
				.post(api('teams.create'))
				.set(credentials)
				.send({ name: `abac-rc-team-${Date.now()}`, type: 1, owner: creator._id, abacAttributes: { [dept]: ['eng'] } })
				.expect(400)
				.expect((res) => {
					expect(res.body.error).to.include('error-abac-attributes-owner-must-be-caller');
				});
		});

		it('reports a denial by its own code rather than error-team-creation', async () => {
			await request
				.post(api('teams.create'))
				.set(creatorCredentials)
				.send({ name: `abac-rc-team-${Date.now()}`, type: 1, abacAttributes: { [dept]: ['sales'] } })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('errorType', 'error-abac-attribute-not-assignable');
				});
		});
	});

	describe('under enforcement', () => {
		before(async () => {
			await setSetting('ABAC_Required_Attributes', [clearance]);
			await setSetting('ABAC_Enforce_All_Rooms', true);
		});

		after(async () => {
			await setSetting('ABAC_Enforce_All_Rooms', false);
			await setSetting('ABAC_Required_Attributes', []);
		});

		it('refuses a private room that would be born locked', async () => {
			await createGroup({})
				.expect(400)
				.expect((res) => {
					expect(res.body.error).to.include('error-abac-attributes-required');
				});
		});

		it('refuses a private room missing a required attribute', async () => {
			await createGroup({ abacAttributes: { [dept]: ['eng'] } })
				.expect(400)
				.expect((res) => {
					expect(res.body.error).to.include('error-abac-attributes-required');
				});
		});

		it('creates a private room carrying every required attribute', async () => {
			const res = await createGroup({ abacAttributes: { [clearance]: ['secret'] } }).expect(200);
			track(res.body.group._id);
		});

		it('refuses a private team that would be born locked, by its own code', async () => {
			await request
				.post(api('teams.create'))
				.set(credentials)
				.send({ name: `abac-rc-team-${Date.now()}`, type: 1 })
				.expect(400)
				.expect((res) => {
					expect(res.body.error).to.include('error-abac-attributes-required');
				});
		});
	});

	describe('POST /abac/attribute-assignability', () => {
		const assignability = (attributes: Record<string, string[]>, as: Credentials = creatorCredentials) =>
			request.post(`${v1}/abac/attribute-assignability`).set(as).send({ attributes });

		before(async () => {
			await updatePermission('create-abac-managed-room', ['admin', 'user']);
			await setSetting('ABAC_Restrict_To_Owned_Attributes', true);
		});

		it('requires create-abac-managed-room', async () => {
			await updatePermission('create-abac-managed-room', ['admin']);

			try {
				await assignability({ [dept]: ['eng'] }).expect(403);
			} finally {
				await updatePermission('create-abac-managed-room', ['admin', 'user']);
			}
		});

		it('rejects an attribute with no values', async () => {
			await assignability({ [dept]: [] }).expect(400);
		});

		it('admits what the creator holds', async () => {
			await assignability({ [dept]: ['eng'] }).expect(200);
		});

		it('refuses what the creator does not hold with the same answer as creation', async () => {
			const [answer, creation] = await Promise.all([
				assignability({ [dept]: ['sales'] }).expect(400),
				createGroup({ abacAttributes: { [dept]: ['sales'] } }, creatorCredentials).expect(400),
			]);

			expect(answer.body.errorType).to.equal('error-abac-attribute-not-assignable');
			expect(answer.body.errorType).to.equal(creation.body.errorType);
			expect(answer.body.details).to.deep.equal(creation.body.details);
			expect(answer.body.details.attributes).to.deep.equal([{ key: dept, values: ['sales'] }]);
		});
	});
});
