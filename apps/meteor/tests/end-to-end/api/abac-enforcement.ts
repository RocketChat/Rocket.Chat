import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';

import { api, getCredentials, request, credentials } from '../../data/api-data';
import { sleep } from '../../data/livechat/utils';
import { getSettingValueById, updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

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
