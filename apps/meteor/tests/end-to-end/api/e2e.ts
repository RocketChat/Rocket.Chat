import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { api, getCredentials, request } from '../../data/api-data';
import { updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('[E2E]', () => {
	before((done) => getCredentials(done));

	describe('/e2e.fetchUsersWaitingForGroupKey', () => {
		let roomOwner: TestUser<IUser>;
		let roomOwnerCredentials: Credentials;
		let roomMember: TestUser<IUser>;
		let outsider: TestUser<IUser>;
		let outsiderCredentials: Credentials;
		let ownerRoom: IRoom;
		let outsiderRoom: IRoom;

		const setKeys = (userCredentials: Credentials, keyName: string) =>
			request
				.post(api('e2e.setUserPublicAndPrivateKeys'))
				.set(userCredentials)
				.send({ public_key: `public-${keyName}`, private_key: `private-${keyName}`, force: true })
				.expect(200);

		const fetchUsersWaitingForGroupKey = (userCredentials: Credentials, roomIds: string[]) =>
			request.get(api('e2e.fetchUsersWaitingForGroupKey')).set(userCredentials).query({ roomIds }).expect(200);

		before(async () => {
			await updateSetting('E2E_Enable', true);

			[roomOwner, roomMember, outsider] = await Promise.all([createUser(), createUser(), createUser()]);

			[roomOwnerCredentials, outsiderCredentials] = await Promise.all([
				login(roomOwner.username, password),
				login(outsider.username, password),
			]);

			const roomMemberCredentials = await login(roomMember.username, password);

			await Promise.all([
				setKeys(roomOwnerCredentials, 'owner'),
				setKeys(roomMemberCredentials, 'member'),
				setKeys(outsiderCredentials, 'outsider'),
			]);

			ownerRoom = (
				await createRoom({
					type: 'p',
					name: `e2e-owner-room-${Date.now()}`,
					members: [roomMember.username],
					credentials: roomOwnerCredentials,
				})
			).body.group;

			outsiderRoom = (
				await createRoom({
					type: 'p',
					name: `e2e-outsider-room-${Date.now()}`,
					members: [roomMember.username],
					credentials: outsiderCredentials,
				})
			).body.group;
		});

		after(async () => {
			await Promise.all([deleteRoom({ type: 'p', roomId: ownerRoom._id }), deleteRoom({ type: 'p', roomId: outsiderRoom._id })]);

			await Promise.all([deleteUser(roomOwner), deleteUser(roomMember), deleteUser(outsider)]);

			await updateSetting('E2E_Enable', false);
		});

		it('should return the users waiting for a group key of a room the caller belongs to', async () => {
			const res = await fetchUsersWaitingForGroupKey(roomOwnerCredentials, [ownerRoom._id]);

			expect(res.body).to.have.property('success', true);
			expect(res.body.usersWaitingForE2EKeys).to.have.property(ownerRoom._id);
			expect(res.body.usersWaitingForE2EKeys[ownerRoom._id].map(({ _id }: { _id: string }) => _id)).to.include(roomMember._id);
		});

		it('should not return any user for a room the caller does not belong to', async () => {
			const res = await fetchUsersWaitingForGroupKey(outsiderCredentials, [ownerRoom._id]);

			expect(res.body).to.have.property('success', true);
			expect(res.body.usersWaitingForE2EKeys).to.not.have.property(ownerRoom._id);
		});

		it('should only return the rooms the caller belongs to when asked for a mix of rooms', async () => {
			const res = await fetchUsersWaitingForGroupKey(outsiderCredentials, [ownerRoom._id, outsiderRoom._id]);

			expect(res.body).to.have.property('success', true);
			expect(res.body.usersWaitingForE2EKeys).to.not.have.property(ownerRoom._id);
			expect(res.body.usersWaitingForE2EKeys).to.have.property(outsiderRoom._id);
		});
	});
});
