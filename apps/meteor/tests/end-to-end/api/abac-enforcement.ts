import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';
import { MongoClient } from 'mongodb';

import { api, getCredentials, request, credentials } from '../../data/api-data';
import { sleep } from '../../data/livechat/utils';
import { getSettingValueById, updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { adminUsername, password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE, URL_MONGODB } from '../../e2e/config/constants';

/**
 * ABAC Phase 4, Milestone 1 — enforcement guards.
 *
 * The excluded room types are covered exhaustively by the unit spec for `isRoomLocked`
 * (`ee/packages/abac/src/is-room-locked.spec.ts`), which asserts every room type including
 * federated and Omnichannel/Livechat. The negative tests here cover the two that are cheap to
 * exercise end to end — 1-on-1 and Group DMs — because those are the ones a real user hits first
 * and the ones an over-broad guard would break most visibly.
 */
(IS_EE ? describe : describe.skip)('[ABAC Enforcement] (Enterprise Only)', function () {
	this.retries(0);

	// Enforcement changes are applied by a settings watcher, so a write has to settle before the
	// next request observes it.
	const SETTLE_MS = 500;

	const setEnforcement = async (value: boolean) => {
		await updateSetting('ABAC_Enforce_All_Rooms', value);
		await sleep(SETTLE_MS);
	};

	let otherUser: IUser;
	let otherCredentials: Credentials;

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('ABAC_Enabled', true);
		await updatePermission('edit-room-abac-attributes', ['admin', 'owner']);

		otherUser = await createUser();
		otherCredentials = await login(otherUser.username, password);
	});

	after(async () => {
		await setEnforcement(false);
		await updateSetting('ABAC_Enabled', false);
		await deleteUser(otherUser);
	});

	describe('excluded room types are untouched by enforcement', () => {
		let dmRoomId: IRoom['_id'];
		let groupDmRoomId: IRoom['_id'];

		before(async () => {
			const dm = await createRoom({ type: 'd', username: otherUser.username });
			dmRoomId = dm.body.room._id;

			const groupDm = await request
				.post(api('im.create'))
				.set(credentials)
				.send({ usernames: [otherUser.username, 'rocket.cat'].join(',') })
				.expect(200);
			groupDmRoomId = groupDm.body.room._id;

			await setEnforcement(true);
		});

		after(async () => {
			await setEnforcement(false);

			// These have to be removed: `im.list.everyone` asserts an exact count elsewhere in the
			// suite, so leaving two direct messages behind fails an unrelated test.
			await deleteRoom({ type: 'd', roomId: dmRoomId });
			await deleteRoom({ type: 'd', roomId: groupDmRoomId });
		});

		it('allows sending a message in a 1-on-1 DM', async () => {
			await request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({ message: { rid: dmRoomId, msg: 'dm under enforcement' } })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('allows sending a message in a Group DM', async () => {
			await request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({ message: { rid: groupDmRoomId, msg: 'group dm under enforcement' } })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});
	});

	describe('locked rooms', () => {
		let lockedRoomId: IRoom['_id'];

		before(async () => {
			// Created before enforcement, so it carries no ABAC attributes — the pre-existing
			// non-compliant room the acceptance criteria describe.
			const room = await createRoom({ type: 'p', name: `abac-locked-${Date.now()}` });
			lockedRoomId = room.body.group._id;

			await setEnforcement(true);
		});

		after(async () => {
			await setEnforcement(false);
			await deleteRoom({ type: 'p', roomId: lockedRoomId });
		});

		it('refuses a message with error-abac-room-locked', async () => {
			await request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({ message: { rid: lockedRoomId, msg: 'should not post' } })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.include('error-abac-room-locked');
				});
		});

		it('refuses adding a member', async () => {
			await request
				.post(api('groups.invite'))
				.set(credentials)
				.send({ roomId: lockedRoomId, userId: otherUser._id })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.include('error-abac-room-locked');
				});
		});

		it('allows both again once enforcement is off', async () => {
			await setEnforcement(false);

			await request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({ message: { rid: lockedRoomId, msg: 'posts fine now' } })
				.expect(200);

			await request.post(api('groups.invite')).set(credentials).send({ roomId: lockedRoomId, userId: otherUser._id }).expect(200);

			await setEnforcement(true);
		});
	});

	describe('blocked creation paths', () => {
		before(async () => {
			await setEnforcement(true);
		});

		after(async () => {
			await setEnforcement(false);
		});

		it('blocks public channel creation (D6)', async () => {
			await request
				.post(api('channels.create'))
				.set(credentials)
				.send({ name: `abac-public-${Date.now()}` })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.include('error-abac-public-room-creation-blocked');
				});
		});

		it('blocks discussion creation (D7)', async () => {
			// The parent has to exist before enforcement is on: from M4, creating a room without
			// attributes is refused, so it cannot be made inside this block.
			await setEnforcement(false);
			const parent = await createRoom({ type: 'p', name: `abac-parent-${Date.now()}` });
			const parentId = parent.body.group._id;
			await setEnforcement(true);

			await request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({ prid: parentId, t_name: `abac-discussion-${Date.now()}` })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});

			await setEnforcement(false);
			await deleteRoom({ type: 'p', roomId: parentId });
			await setEnforcement(true);
		});

		it('refuses a private channel carrying no attributes (M4)', async () => {
			// Up to M3 this was allowed and the room was simply born locked. From M4 a room that
			// would be born locked is refused instead.
			await request
				.post(api('groups.create'))
				.set(credentials)
				.send({ name: `abac-private-${Date.now()}` })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.include('error-abac-attributes-required');
				});
		});
	});

	/**
	 * Clearing every attribute is how a room stops being ABAC-managed, and it has its own endpoint.
	 *
	 * The replace-all route requires at least one attribute, so committing an empty set through it
	 * fails with "must NOT have fewer than 1 properties" — which is what the room panel used to do
	 * once removing the last attribute became possible (ABAC-P4 QA). These pin the contract the
	 * client now relies on.
	 */
	describe('clearing every attribute', () => {
		const attributeKey = `clearclearance${Date.now()}`;
		let attributeId: string;
		let roomId: IRoom['_id'];

		before(async () => {
			await updatePermission('abac-management', ['admin']);
			await updatePermission('manage-abac-admin-rooms', ['admin']);
			await updatePermission('manage-abac-admin-room-attributes', ['admin']);
			await updateSetting('ABAC_Restrict_To_Owned_Attributes', false);

			await request
				.post(api('abac/attributes'))
				.set(credentials)
				.send({ key: attributeKey, values: ['secret'] })
				.expect(200);
			const { body } = await request.get(api('abac/attributes')).set(credentials).query({ key: attributeKey });
			attributeId = body.attributes.find((attribute: { key: string }) => attribute.key === attributeKey)._id;

			const room = await request
				.post(api('groups.create'))
				.set(credentials)
				.send({ name: `abac-clear-${Date.now()}`, abacAttributes: { [attributeKey]: ['secret'] } })
				.expect(200);
			roomId = room.body.group._id;
		});

		after(async () => {
			await deleteRoom({ type: 'p', roomId });
			await request.delete(api(`abac/attributes/${attributeId}`)).set(credentials);
			await updateSetting('ABAC_Restrict_To_Owned_Attributes', true);
		});

		it('refuses an empty set on the replace-all route', async () => {
			await request
				.post(api(`abac/rooms/${roomId}/attributes`))
				.set(credentials)
				.send({ attributes: {} })
				.expect(400);
		});

		it('removes them all through DELETE, leaving a room that is no longer ABAC-managed', async () => {
			await request
				.delete(api(`abac/rooms/${roomId}/attributes`))
				.set(credentials)
				.expect(200);

			const info = await request.get(api('groups.info')).set(credentials).query({ roomId }).expect(200);
			expect(info.body.group.abacAttributes ?? []).to.be.an('array').that.is.empty;
		});
	});

	/**
	 * The founding members of a room have to be evaluated against its attributes, like anyone
	 * invited later.
	 *
	 * They were not. `addUserToRoom` runs two hooks — a `makeFunction` seam and a `Callbacks` hook
	 * of the same name — and the ABAC compliance guard lives on the seam. Creation ran only the
	 * `Callbacks` one, so every founding member was admitted unchecked, on every creation path
	 * including the REST API (ABAC-P4 QA).
	 */
	describe('founding members are evaluated against the room attributes', () => {
		const attributeKey = `foundingclearance${Date.now()}`;
		let connection: MongoClient;
		let attributeId: string;
		let compliantUser: IUser;

		before(async () => {
			connection = await MongoClient.connect(URL_MONGODB);

			await updatePermission('abac-management', ['admin']);
			await updatePermission('manage-abac-admin-room-attributes', ['admin']);

			await request
				.post(api('abac/attributes'))
				.set(credentials)
				.send({ key: attributeKey, values: ['secret'] })
				.expect(200);
			const { body } = await request.get(api('abac/attributes')).set(credentials).query({ key: attributeKey });
			attributeId = body.attributes.find((attribute: { key: string }) => attribute.key === attributeKey)._id;

			compliantUser = await createUser();

			// The local PDP decides from the database, so the subject attributes are written there
			// directly — the same approach the other ABAC suites take rather than going through LDAP.
			await connection
				.db()
				.collection<IUser>('users')
				.updateMany(
					{ username: { $in: [adminUsername, compliantUser.username as string] } },
					{ $push: { abacAttributes: { key: attributeKey, values: ['secret'] } } },
				);
		});

		after(async () => {
			await connection
				.db()
				.collection<IUser>('users')
				.updateMany(
					{ username: { $in: [adminUsername, compliantUser.username as string] } },
					{ $pull: { abacAttributes: { key: attributeKey } } },
				);
			await connection.close();

			await deleteUser(compliantUser);
			await request.delete(api(`abac/attributes/${attributeId}`)).set(credentials);
		});

		it('leaves a non-compliant founding member out of the room', async () => {
			const created = await request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `abac-founding-${Date.now()}`,
					members: [compliantUser.username, otherUser.username],
					abacAttributes: { [attributeKey]: ['secret'] },
				})
				.expect(200);

			const roomId = created.body.group._id;

			const members = await request.get(api('groups.members')).set(credentials).query({ roomId, count: 50 }).expect(200);
			const usernames = members.body.members.map(({ username }: { username: string }) => username);

			expect(usernames).to.include(compliantUser.username);
			// `otherUser` carries no subject attributes, so the room's attribute excludes them.
			expect(usernames).to.not.include(otherUser.username);

			await deleteRoom({ type: 'p', roomId });
		});

		it('still admits every compliant founding member', async () => {
			const created = await request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `abac-founding-ok-${Date.now()}`,
					members: [compliantUser.username],
					abacAttributes: { [attributeKey]: ['secret'] },
				})
				.expect(200);

			const roomId = created.body.group._id;

			const members = await request.get(api('groups.members')).set(credentials).query({ roomId, count: 50 }).expect(200);
			const usernames = members.body.members.map(({ username }: { username: string }) => username);

			expect(usernames).to.include(compliantUser.username);
			expect(usernames).to.include(adminUsername);

			await deleteRoom({ type: 'p', roomId });
		});

		it('leaves a room without attributes alone', async () => {
			const created = await request
				.post(api('groups.create'))
				.set(credentials)
				.send({ name: `abac-founding-plain-${Date.now()}`, members: [otherUser.username] })
				.expect(200);

			const roomId = created.body.group._id;

			const members = await request.get(api('groups.members')).set(credentials).query({ roomId, count: 50 }).expect(200);
			const usernames = members.body.members.map(({ username }: { username: string }) => username);

			expect(usernames).to.include(otherUser.username);

			await deleteRoom({ type: 'p', roomId });
		});
	});

	/**
	 * A team's main room is created through `createRoom` like any other, so the enforcement guards
	 * already applied to it — but `teams.create` had no way to carry attributes, which left team
	 * creation impossible once enforcement was on (ABAC-P4 QA).
	 */
	describe('team creation', () => {
		const attributeKey = `teamclearance${Date.now()}`;
		let attributeId: string;

		before(async () => {
			await updatePermission('abac-management', ['admin']);
			await updatePermission('manage-abac-admin-room-attributes', ['admin']);
			// The admin carries no subject attributes here, so D12 would refuse anything they chose.
			await updateSetting('ABAC_Restrict_To_Owned_Attributes', false);

			await request
				.post(api('abac/attributes'))
				.set(credentials)
				.send({ key: attributeKey, values: ['secret'] })
				.expect(200);
			const { body } = await request.get(api('abac/attributes')).set(credentials).query({ key: attributeKey });
			attributeId = body.attributes.find((attribute: { key: string }) => attribute.key === attributeKey)._id;

			await setEnforcement(true);
		});

		after(async () => {
			await setEnforcement(false);
			await request.delete(api(`abac/attributes/${attributeId}`)).set(credentials);
			await updateSetting('ABAC_Restrict_To_Owned_Attributes', true);
		});

		it('refuses a team whose main room would carry no attributes', async () => {
			await request
				.post(api('teams.create'))
				.set(credentials)
				.send({ name: `abac-team-${Date.now()}`, type: 1 })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.include('error-abac-attributes-required');
				});
		});

		it('creates a team whose main room carries the attributes it was given', async () => {
			const teamName = `abac-team-ok-${Date.now()}`;

			const created = await request
				.post(api('teams.create'))
				.set(credentials)
				.send({ name: teamName, type: 1, abacAttributes: { [attributeKey]: ['secret'] } })
				.expect(200);

			const { roomId } = created.body.team;
			const info = await request.get(api('groups.info')).set(credentials).query({ roomId }).expect(200);

			expect(info.body.group.abacAttributes).to.deep.equal([{ key: attributeKey, values: ['secret'] }]);

			await setEnforcement(false);
			await request
				.post(api('teams.delete'))
				.set(credentials)
				.send({ teamName, roomsToRemove: [roomId] });
			await setEnforcement(true);
		});
	});

	describe('Discussion_enabled override and restore (D10)', () => {
		after(async () => {
			await setEnforcement(false);
			await updateSetting('Discussion_enabled', true);
		});

		it('overrides the setting to false and restores the prior value of true', async () => {
			await updateSetting('Discussion_enabled', true);

			await setEnforcement(true);
			expect(await getSettingValueById('Discussion_enabled')).to.equal(false);

			await setEnforcement(false);
			expect(await getSettingValueById('Discussion_enabled')).to.equal(true);
		});

		it('restores a prior value of false rather than defaulting to true', async () => {
			await updateSetting('Discussion_enabled', false);

			await setEnforcement(true);
			expect(await getSettingValueById('Discussion_enabled')).to.equal(false);

			await setEnforcement(false);
			expect(await getSettingValueById('Discussion_enabled')).to.equal(false);
		});

		it('refuses an attempt to re-enable discussions while enforcement is on', async () => {
			await updateSetting('Discussion_enabled', true);
			await setEnforcement(true);

			await request
				.post(api('settings/Discussion_enabled'))
				.set(credentials)
				.send({ value: true })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});

			// The refusal must leave the override intact rather than half-applied.
			expect(await getSettingValueById('Discussion_enabled')).to.equal(false);

			await setEnforcement(false);
			expect(await getSettingValueById('Discussion_enabled')).to.equal(true);
		});
	});

	describe('non-admin surfaces', () => {
		let lockedRoomId: IRoom['_id'];

		before(async () => {
			const room = await createRoom({ type: 'p', name: `abac-locked-member-${Date.now()}`, members: [otherUser.username!] });
			lockedRoomId = room.body.group._id;
			await setEnforcement(true);
		});

		after(async () => {
			await setEnforcement(false);
			await deleteRoom({ type: 'p', roomId: lockedRoomId });
		});

		it('refuses a message from a regular member too', async () => {
			await request
				.post(api('chat.sendMessage'))
				.set(otherCredentials)
				.send({ message: { rid: lockedRoomId, msg: 'member should not post' } })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.include('error-abac-room-locked');
				});
		});
	});
});
