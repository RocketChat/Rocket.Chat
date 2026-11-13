import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { api, getCredentials, request } from '../../data/api-data';
import { updateSetting } from '../../data/permissions.helper';
import { actionRoom, createRoom, getRoomInfo, getSubscriptionByRoomId } from '../../data/rooms.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('[E2E]', () => {
	const run = Date.now();
	let owner: TestUser<IUser>;
	let member: TestUser<IUser>;
	let outsider: TestUser<IUser>;
	let ownerCredentials: Credentials;
	let memberCredentials: Credentials;
	let outsiderCredentials: Credentials;
	let room: IRoom;

	const setKeys = (userCredentials: Credentials, publicKey: string) =>
		request
			.post(api('e2e.setUserPublicAndPrivateKeys'))
			.set(userCredentials)
			.send({ public_key: publicKey, private_key: `private-${publicKey}` })
			.expect(200);

	const usersWithoutKey = async (userCredentials: Credentials) => {
		const res = await request.get(api('e2e.getUsersOfRoomWithoutKey')).set(userCredentials).query({ rid: room._id }).expect(200);
		return res.body.users as Pick<IUser, '_id' | 'e2e'>[];
	};

	const usersWaitingForKey = async (userCredentials: Credentials) => {
		const res = await request
			.get(api('e2e.fetchUsersWaitingForGroupKey'))
			.set(userCredentials)
			.query({ roomIds: [room._id] })
			.expect(200);
		return res.body.usersWaitingForE2EKeys as Record<string, { _id: string; public_key: string }[]>;
	};

	before((_t, done) => getCredentials(done));

	before(async () => {
		await updateSetting('E2E_Enable', true);
		[owner, member, outsider] = await Promise.all([createUser(), createUser(), createUser()]);
		[ownerCredentials, memberCredentials, outsiderCredentials] = await Promise.all([
			login(owner.username, password),
			login(member.username, password),
			login(outsider.username, password),
		]);
		await Promise.all([setKeys(ownerCredentials, 'owner-public-key'), setKeys(memberCredentials, 'member-public-key')]);
		room = (
			await createRoom({
				type: 'p',
				name: `e2e-keys-${Date.now()}`,
				members: [member.username],
				extraData: { encrypted: true },
				credentials: ownerCredentials,
			})
		).body.group;
	});

	after(async () => {
		await Promise.all([
			updateSetting('E2E_Enable', false),
			actionRoom({ action: 'delete', type: 'p', roomId: room._id, overrideCredentials: ownerCredentials }),
		]);
		await Promise.all([deleteUser(owner), deleteUser(member), deleteUser(outsider)]);
	});

	describe('[/e2e.setRoomKeyID]', () => {
		it('should store the key ID on the room when a member sets it', async () => {
			await request.post(api('e2e.setRoomKeyID')).set(ownerCredentials).send({ rid: room._id, keyID: 'first-key-id' }).expect(200);

			expect((await getRoomInfo(room._id)).room).to.have.property('e2eKeyId', 'first-key-id');
		});

		it('should keep the first key ID when a member sets another one', async () => {
			const res = await request
				.post(api('e2e.setRoomKeyID'))
				.set(memberCredentials)
				.send({ rid: room._id, keyID: 'second-key-id' })
				.expect(400);

			expect(res.body).to.have.property('errorType', 'error-room-e2e-key-already-exists');
			expect((await getRoomInfo(room._id)).room).to.have.property('e2eKeyId', 'first-key-id');
		});

		it('should fail if the user is not in the room', async () => {
			const res = await request
				.post(api('e2e.setRoomKeyID'))
				.set(outsiderCredentials)
				.send({ rid: room._id, keyID: 'outsider-key-id' })
				.expect(400);

			expect(res.body).to.have.property('errorType', 'error-invalid-room');
		});
	});

	describe('[/e2e.getUsersOfRoomWithoutKey]', () => {
		it('should list the members who have a public key but no room key', async () => {
			const users = await usersWithoutKey(ownerCredentials);

			expect(users.map(({ _id }) => _id)).to.have.members([owner._id, member._id]);
			expect(users.find(({ _id }) => _id === member._id)).to.have.nested.property('e2e.public_key', 'member-public-key');
		});

		it('should fail if the user cannot access the room', async () => {
			const res = await request.get(api('e2e.getUsersOfRoomWithoutKey')).set(outsiderCredentials).query({ rid: room._id }).expect(400);

			expect(res.body).to.have.property('errorType', 'error-invalid-room');
		});
	});

	describe('[/e2e.updateGroupKey]', () => {
		it("should store the caller's own room key on their subscription", async () => {
			await request
				.post(api('e2e.updateGroupKey'))
				.set(ownerCredentials)
				.send({ rid: room._id, uid: owner._id, key: `owner-room-key-${run}` })
				.expect(200);

			expect(await getSubscriptionByRoomId(room._id, ownerCredentials)).to.have.property('E2EKey', `owner-room-key-${run}`);
			expect((await usersWithoutKey(ownerCredentials)).map(({ _id }) => _id)).to.deep.equal([member._id]);
		});

		it('should store the key as a suggestion when the caller sets it for another member', async () => {
			await request
				.post(api('e2e.updateGroupKey'))
				.set(ownerCredentials)
				.send({ rid: room._id, uid: member._id, key: `suggested-for-member-${run}` })
				.expect(200);

			const subscription = await getSubscriptionByRoomId(room._id, memberCredentials);
			expect(subscription).to.have.property('E2ESuggestedKey', `suggested-for-member-${run}`);
			expect(subscription).to.not.have.property('E2EKey');
		});
	});

	describe('[/e2e.acceptSuggestedGroupKey]', () => {
		it('should make the suggested key the room key of the member who accepts it', async () => {
			await request.post(api('e2e.acceptSuggestedGroupKey')).set(memberCredentials).send({ rid: room._id }).expect(200);

			const subscription = await getSubscriptionByRoomId(room._id, memberCredentials);
			expect(subscription).to.have.property('E2EKey', `suggested-for-member-${run}`);
			expect(subscription).to.not.have.property('E2ESuggestedKey');
		});

		it('should fail when there is no suggested key to accept', async () => {
			const res = await request.post(api('e2e.acceptSuggestedGroupKey')).set(memberCredentials).send({ rid: room._id }).expect(400);

			expect(res.body).to.have.property('errorType', 'error-no-suggested-key-available');
		});
	});

	describe('[/e2e.rejectSuggestedGroupKey]', () => {
		it('should drop the suggestion and queue the member to receive another key', async () => {
			await request
				.post(api('e2e.updateGroupKey'))
				.set(ownerCredentials)
				.send({ rid: room._id, uid: member._id, key: `second-suggestion-${run}` })
				.expect(200);

			await request.post(api('e2e.rejectSuggestedGroupKey')).set(memberCredentials).send({ rid: room._id }).expect(200);

			expect(await getSubscriptionByRoomId(room._id, memberCredentials)).to.not.have.property('E2ESuggestedKey');
			const { room: roomInfo } = await getRoomInfo(room._id);
			expect(roomInfo?.usersWaitingForE2EKeys?.map(({ userId }) => userId)).to.include(member._id);
		});
	});

	describe('[/e2e.fetchUsersWaitingForGroupKey]', () => {
		before(() =>
			request
				.post(api('e2e.resetRoomKey'))
				.set(ownerCredentials)
				.send({ rid: room._id, e2eKey: `owner-key-2-${run}`, e2eKeyId: 'key-id-2' }),
		);

		it('should list the other members who still need the room key, with their public keys', async () => {
			expect(await usersWaitingForKey(ownerCredentials)).to.deep.equal({
				[room._id]: [{ _id: member._id, public_key: 'member-public-key' }],
			});
		});

		it('should list nobody while E2E encryption is disabled', async () => {
			await updateSetting('E2E_Enable', false);
			try {
				expect(await usersWaitingForKey(ownerCredentials)).to.deep.equal({});
			} finally {
				await updateSetting('E2E_Enable', true);
			}
		});
	});

	describe('[/e2e.provideUsersSuggestedGroupKeys]', () => {
		it('should ignore the keys a user provides for a room they cannot access', async () => {
			await request
				.post(api('e2e.provideUsersSuggestedGroupKeys'))
				.set(outsiderCredentials)
				.send({ usersSuggestedGroupKeys: { [room._id]: [{ _id: member._id, key: `from-outsider-${run}` }] } })
				.expect(200);

			expect(await getSubscriptionByRoomId(room._id, memberCredentials)).to.not.have.property('E2ESuggestedKey');
		});

		it('should suggest the provided key to each waiting member and take them out of the queue', async () => {
			await request
				.post(api('e2e.provideUsersSuggestedGroupKeys'))
				.set(ownerCredentials)
				.send({ usersSuggestedGroupKeys: { [room._id]: [{ _id: member._id, key: `provided-key-${run}` }] } })
				.expect(200);

			expect(await getSubscriptionByRoomId(room._id, memberCredentials)).to.have.property('E2ESuggestedKey', `provided-key-${run}`);
			const { room: roomInfo } = await getRoomInfo(room._id);
			expect(roomInfo?.usersWaitingForE2EKeys?.map(({ userId }) => userId) ?? []).to.not.include(member._id);
		});
	});

	describe('[/e2e.resetRoomKey]', () => {
		it('should fail if the member does not have the toggle-room-e2e-encryption permission', async () => {
			await request
				.post(api('e2e.resetRoomKey'))
				.set(memberCredentials)
				.send({ rid: room._id, e2eKey: `member-key-${run}`, e2eKeyId: 'member-key-id' })
				.expect(403);

			expect((await getRoomInfo(room._id)).room).to.have.property('e2eKeyId', 'key-id-2');
		});

		it("should replace the room key ID and the owner's room key, and clear the keys of the other members", async () => {
			await request
				.post(api('e2e.resetRoomKey'))
				.set(ownerCredentials)
				.send({ rid: room._id, e2eKey: `owner-key-3-${run}`, e2eKeyId: 'key-id-3' })
				.expect(200);

			expect((await getRoomInfo(room._id)).room).to.have.property('e2eKeyId', 'key-id-3');
			expect(await getSubscriptionByRoomId(room._id, ownerCredentials)).to.have.property('E2EKey', `owner-key-3-${run}`);
			expect(await getSubscriptionByRoomId(room._id, memberCredentials)).to.not.have.any.keys('E2EKey', 'E2ESuggestedKey');
		});
	});
});
