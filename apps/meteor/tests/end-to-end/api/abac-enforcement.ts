import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { TeamType } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';
import { MongoClient } from 'mongodb';

import { addAbacAttributesToUserDirectly } from '../../data/abac.helper';
import { api, getCredentials, request, credentials } from '../../data/api-data';
import { sleep } from '../../data/livechat/utils';
import { updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { createTeam, deleteTeam } from '../../data/teams.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE, URL_MONGODB } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[ABAC Enforcement] (Enterprise Only)', function () {
	this.retries(0);

	let connection: MongoClient;

	const SETTLE_MS = 500;

	const setEnforcement = async (value: boolean) => {
		await updateSetting('ABAC_Enforce_All_Rooms', value);
		await sleep(SETTLE_MS);
	};

	const setRequiredAttributes = async (keys: string[]) => {
		await updateSetting('ABAC_Required_Attributes', keys);
		await sleep(SETTLE_MS);
	};

	let otherUser: IUser;
	let otherCredentials: Credentials;

	before((done) => getCredentials(done));

	before(async () => {
		connection = await MongoClient.connect(URL_MONGODB);

		await updateSetting('ABAC_Enabled', true);

		otherUser = await createUser();
		otherCredentials = await login(otherUser.username, password);
	});

	after(async () => {
		await setEnforcement(false);
		await setRequiredAttributes([]);
		await updateSetting('ABAC_Enabled', false);
		await deleteUser(otherUser);
		await connection.close();
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
			await deleteRoom({ type: 'd', roomId: dmRoomId });
			await deleteRoom({ type: 'd', roomId: groupDmRoomId });
		});

		it('allows sending a message in a 1-on-1 DM', async () => {
			await request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({ message: { rid: dmRoomId, msg: 'dm under enforcement' } })
				.expect(200);
		});

		it('allows sending a message in a Group DM', async () => {
			await request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({ message: { rid: groupDmRoomId, msg: 'group dm under enforcement' } })
				.expect(200);
		});
	});

	describe('locked rooms', () => {
		let lockedRoomId: IRoom['_id'];

		before(async () => {
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

	describe('changing the required attributes re-locks a compliant room', () => {
		const carriedKey = `abac_enf_carried_${Date.now()}`;
		const laterKey = `abac_enf_later_${Date.now()}`;
		let compliantRoomId: IRoom['_id'];

		before(async () => {
			await request
				.post(api('abac/attributes'))
				.set(credentials)
				.send({ key: carriedKey, values: ['value'] })
				.expect(200);
			await request
				.post(api('abac/attributes'))
				.set(credentials)
				.send({ key: laterKey, values: ['value'] })
				.expect(200);

			await addAbacAttributesToUserDirectly(connection, credentials['X-User-Id'], [
				{ key: carriedKey, values: ['value'] },
				{ key: laterKey, values: ['value'] },
			]);

			const room = await createRoom({ type: 'p', name: `abac-compliant-${Date.now()}` });
			compliantRoomId = room.body.group._id;

			await request
				.post(api(`abac/rooms/${compliantRoomId}/attributes`))
				.set(credentials)
				.send({ attributes: { [carriedKey]: ['value'] } })
				.expect(200);

			await setRequiredAttributes([carriedKey]);
			await setEnforcement(true);
		});

		after(async () => {
			await setEnforcement(false);
			await setRequiredAttributes([]);
			await deleteRoom({ type: 'p', roomId: compliantRoomId });
			await addAbacAttributesToUserDirectly(connection, credentials['X-User-Id'], []);

			for (const key of [carriedKey, laterKey]) {
				const res = await request.get(api('abac/attributes')).query({ key }).set(credentials).expect(200);
				const attribute = (res.body.attributes as { _id: string; key: string }[]).find((a) => a.key === key);
				if (attribute) {
					await request
						.delete(api(`abac/attributes/${attribute._id}`))
						.set(credentials)
						.expect(200);
				}
			}
		});

		it('allows a message while the room carries every required attribute', async () => {
			await request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({ message: { rid: compliantRoomId, msg: 'compliant' } })
				.expect(200);
		});

		it('refuses a message once a new attribute is required', async () => {
			await setRequiredAttributes([carriedKey, laterKey]);

			await request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({ message: { rid: compliantRoomId, msg: 'no longer compliant' } })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.include('error-abac-room-locked');
				});
		});
	});

	describe('blocked creation paths', () => {
		before(async () => {
			await setEnforcement(true);
		});

		after(async () => {
			await setEnforcement(false);
		});

		it('blocks public channel creation', async () => {
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

		it('blocks discussion creation', async () => {
			const parent = await createRoom({ type: 'p', name: `abac-parent-${Date.now()}` });
			const parentId = parent.body.group._id;

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

		it('still allows private channel creation', async () => {
			const res = await request
				.post(api('groups.create'))
				.set(credentials)
				.send({ name: `abac-private-${Date.now()}` })
				.expect(200);

			const roomId = res.body.group._id;

			await setEnforcement(false);
			await deleteRoom({ type: 'p', roomId });
			await setEnforcement(true);
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

	describe('default rooms', () => {
		const teamKey = `abac_enf_team_${Date.now()}`;
		const teamName = `abac-enf-team-${Date.now()}`;
		let defaultRoomId: IRoom['_id'];
		let teamDefaultRoomId: IRoom['_id'];
		let laterTeamRoomId: IRoom['_id'];
		let teamId: string;
		let newUser: IUser;
		let teamMember: IUser;

		const memberUsernames = async (roomId: IRoom['_id']): Promise<string[]> => {
			const res = await request.get(api('groups.members')).query({ roomId }).set(credentials).expect(200);
			return (res.body.members as { username: string }[]).map(({ username }) => username);
		};

		before(async () => {
			const room = await createRoom({ type: 'p', name: `abac-enf-default-${Date.now()}` });
			defaultRoomId = room.body.group._id;
			await request.post(api('rooms.saveRoomSettings')).set(credentials).send({ rid: defaultRoomId, default: true }).expect(200);

			await request
				.post(api('abac/attributes'))
				.set(credentials)
				.send({ key: teamKey, values: ['value'] })
				.expect(200);
			await addAbacAttributesToUserDirectly(connection, credentials['X-User-Id'], [{ key: teamKey, values: ['value'] }]);

			const team = await createTeam(credentials, teamName, TeamType.PRIVATE);
			teamId = team._id;
			await request
				.post(api(`abac/rooms/${team.roomId}/attributes/${teamKey}`))
				.set(credentials)
				.send({ values: ['value'] })
				.expect(200);

			const teamRoom = await createRoom({ type: 'p', name: `abac-enf-team-default-${Date.now()}`, extraData: { teamId } });
			teamDefaultRoomId = teamRoom.body.group._id;
			await request.post(api('teams.updateRoom')).set(credentials).send({ roomId: teamDefaultRoomId, isDefault: true }).expect(200);

			const laterRoom = await createRoom({ type: 'p', name: `abac-enf-team-later-${Date.now()}`, extraData: { teamId } });
			laterTeamRoomId = laterRoom.body.group._id;

			await setEnforcement(true);
		});

		after(async () => {
			await setEnforcement(false);
			await request.post(api('rooms.saveRoomSettings')).set(credentials).send({ rid: defaultRoomId, default: false }).expect(200);
			await deleteRoom({ type: 'p', roomId: defaultRoomId });
			await deleteTeam(credentials, teamName);
			await deleteRoom({ type: 'p', roomId: teamDefaultRoomId });
			await deleteRoom({ type: 'p', roomId: laterTeamRoomId });
			await addAbacAttributesToUserDirectly(connection, credentials['X-User-Id'], []);
			await Promise.all([newUser, teamMember].filter(Boolean).map((user) => deleteUser(user)));

			const res = await request.get(api('abac/attributes')).query({ key: teamKey }).set(credentials).expect(200);
			const attribute = (res.body.attributes as { _id: string; key: string }[]).find((a) => a.key === teamKey);
			if (attribute) {
				await request
					.delete(api(`abac/attributes/${attribute._id}`))
					.set(credentials)
					.expect(200);
			}
		});

		it('does not auto-join a new user to a locked default room', async () => {
			newUser = await createUser();

			expect(await memberUsernames(defaultRoomId)).to.not.include(newUser.username);
		});

		it('adds a member to the team without joining its locked default room', async () => {
			teamMember = await createUser({ joinDefaultChannels: false });
			await addAbacAttributesToUserDirectly(connection, teamMember._id, [{ key: teamKey, values: ['value'] }]);

			await request
				.post(api('teams.addMembers'))
				.set(credentials)
				.send({ teamId, members: [{ userId: teamMember._id, roles: ['member'] }] })
				.expect(200);

			expect(await memberUsernames(teamDefaultRoomId)).to.not.include(teamMember.username);
		});

		it('marks a locked room as team default without adding the team members', async () => {
			await request
				.post(api('teams.updateRoom'))
				.set(credentials)
				.send({ roomId: laterTeamRoomId, isDefault: true })
				.expect(200)
				.expect((res) => {
					expect(res.body.room).to.have.property('teamDefault', true);
				});

			expect(await memberUsernames(laterTeamRoomId)).to.not.include(teamMember.username);
		});
	});
});
