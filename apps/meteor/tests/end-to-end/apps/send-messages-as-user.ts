import type { Credentials } from '@rocket.chat/api-client';
import type { App, IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { apps } from '../../data/apps/apps-data';
import { cleanupApps, installTestApp } from '../../data/apps/helper';
import { getMessageById } from '../../data/chat.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { adminUsername, password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Apps - Send Messages As User', () => {
	let app: App;

	before((done) => getCredentials(done));
	before(async () => {
		await cleanupApps();
		app = await installTestApp();
	});

	after(() => cleanupApps());

	describe('[Send Message as user]', () => {
		it('should return an error when the room is not found', (done) => {
			void request
				.post(apps(`/public/${app.id}/send-message-as-user`))
				.send({
					roomId: 'invalid-room',
				})
				.set(credentials)
				.expect(404)
				.expect((err: unknown, res: undefined) => {
					expect(err).to.have.a.property('error');
					expect(res).to.be.equal(undefined);
					expect((err as { error?: any }).error).to.have.a.property('text');
					expect((err as { error?: any }).error.text).to.be.equal('Room "invalid-room" could not be found');
				})
				.end(done);
		});
		it('should return an error when the user is not found', (done) => {
			void request
				.post(apps(`/public/${app.id}/send-message-as-user?userId=invalid-user`))
				.send({
					roomId: 'GENERAL',
				})
				.set(credentials)
				.expect(404)
				.expect((err: unknown, res: undefined) => {
					expect(err).to.have.a.property('error');
					expect(res).to.be.equal(undefined);
					expect((err as { error?: any }).error).to.have.a.property('text');
					expect((err as { error?: any }).error.text).to.be.equal('User with id "invalid-user" could not be found');
				})
				.end(done);
		});
		describe('Send to a Public Channel', () => {
			let publicMessageId: IMessage['_id'];
			it('should send a message as app user', (done) => {
				void request
					.post(apps(`/public/${app.id}/send-message-as-user?userId=${adminUsername}`))
					.set(credentials)
					.send({
						roomId: 'GENERAL',
					})
					.expect(200)
					.expect((res) => {
						const response = JSON.parse(res.text);
						expect(response).to.have.a.property('messageId');
						publicMessageId = response.messageId;
					})
					.end(done);
			});
			it('should be a valid message', async () => {
				const message = await getMessageById({ msgId: publicMessageId });
				expect(message.msg).to.be.equal('Executing send-message-as-user test endpoint');
			});
		});
		describe('Send to a Private Channel', () => {
			let privateMessageId: IMessage['_id'];
			let group: IRoom;
			let user: TestUser<IUser>;
			let userCredentials: Credentials;

			before(async () => {
				group = (
					await createRoom({
						type: 'p',
						name: `apps-e2etest-room-${Date.now()}`,
					})
				).body.group;
				user = await createUser();
				userCredentials = await login(user.username, password);
			});

			after(() => Promise.all([deleteRoom({ type: 'p', roomId: group._id }), deleteUser(user)]));

			it('should return 500 when sending a message as user that has no permissions', (done) => {
				void request
					.post(apps(`/public/${app.id}/send-message-as-user?userId=${user._id}`))
					.set(userCredentials)
					.send({
						roomId: group._id,
					})
					.expect(500)
					.end(done);
			});
			it('should send a message as app user', (done) => {
				void request
					.post(apps(`/public/${app.id}/send-message-as-user?userId=${adminUsername}`))
					.set(credentials)
					.send({
						roomId: group._id,
					})
					.expect(200)
					.expect((res) => {
						const response = JSON.parse(res.text);
						expect(response).to.have.a.property('messageId');
						privateMessageId = response.messageId;
					})
					.end(done);
			});
			it('should be a valid message', async () => {
				const message = await getMessageById({ msgId: privateMessageId });
				expect(message.msg).to.be.equal('Executing send-message-as-user test endpoint');
			});
		});
		describe('Send to a DM Channel', () => {
			let DMMessageId: IMessage['_id'];
			let dmRoom: IRoom;

			before(async () => {
				dmRoom = (
					await createRoom({
						type: 'd',
						username: 'rocket.cat',
					})
				).body.room;
			});

			after(() => deleteRoom({ type: 'd', roomId: dmRoom._id }));

			it('should send a message as app user', (done) => {
				void request
					.post(apps(`/public/${app.id}/send-message-as-user?userId=${adminUsername}`))
					.set(credentials)
					.send({
						roomId: dmRoom._id,
					})
					.expect(200)
					.expect((res) => {
						const response = JSON.parse(res.text);
						expect(response).to.have.a.property('messageId');
						DMMessageId = response.messageId;
					})
					.end(done);
			});
			it('should be a valid message', async () => {
				const message = await getMessageById({ msgId: DMMessageId });
				expect(message.msg).to.be.equal('Executing send-message-as-user test endpoint');
			});
		});
	});
});
