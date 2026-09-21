import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';

import { api, getCredentials, request, credentials } from '../../data/api-data';
import { sleep } from '../../data/livechat/utils';
import { updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

/**
 * Every room type is covered by `apps/meteor/lib/rooms/isRoomAbacLocked.spec.ts`. Only DMs are
 * repeated here, because they are what an over-broad guard would break most visibly.
 */
(IS_EE ? describe : describe.skip)('[ABAC Enforcement] (Enterprise Only)', function () {
	this.retries(0);

	const v1 = '/api/v1';

	// Enforcement changes are applied by a settings watcher, so a write has to settle before the
	// next request observes it.
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
		await updateSetting('ABAC_Enabled', true);

		otherUser = await createUser();
		otherCredentials = await login(otherUser.username, password);
	});

	after(async () => {
		await setEnforcement(false);
		await setRequiredAttributes([]);
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

	describe('changing the required attributes re-locks a compliant room (D3)', () => {
		const carriedKey = `abac_enf_carried_${Date.now()}`;
		const laterKey = `abac_enf_later_${Date.now()}`;
		let compliantRoomId: IRoom['_id'];

		before(async () => {
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: carriedKey, values: ['value'] })
				.expect(200);
			await request
				.post(`${v1}/abac/attributes`)
				.set(credentials)
				.send({ key: laterKey, values: ['value'] })
				.expect(200);

			const room = await createRoom({ type: 'p', name: `abac-compliant-${Date.now()}` });
			compliantRoomId = room.body.group._id;

			await request
				.post(`${v1}/abac/rooms/${compliantRoomId}/attributes`)
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
			// Enforcement does not require attributes at creation, only afterwards, so the channel is
			// created and then locked until they are assigned.
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
});
