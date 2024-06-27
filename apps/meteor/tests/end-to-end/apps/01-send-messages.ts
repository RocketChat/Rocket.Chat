import type { App, IMessage, IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { apps } from '../../data/apps/apps-data';
import { cleanupApps, installTestApp } from '../../data/apps/helper';
import { getMessageById } from '../../data/chat.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';

describe('Apps - Send Messages As APP User', () => {
	let app: App;

	before((done) => getCredentials(done));
	before(async () => {
		await cleanupApps();
		app = await installTestApp();
	});

	after(() => cleanupApps());

	describe('[Send Message as app user]', () => {
		it('should return an error when the room is not found', (done) => {
			void request
				.post(apps(`/public/${app.id}/send-message-as-app-user`))
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
		describe('Send to a Public Channel', () => {
			let publicMessageId: IMessage['_id'];
			it('should send a message as app user', (done) => {
				void request
					.post(apps(`/public/${app.id}/send-message-as-app-user`))
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
				expect(message.msg).to.be.equal('Executing send-message-as-app-user test endpoint');
			});
		});
		describe('Send to a Private Channel', () => {
			let privateMessageId: IMessage['_id'];
			let group: IRoom;

			before(async () => {
				group = (
					await createRoom({
						type: 'p',
						name: `apps-e2etest-room-${Date.now()}`,
					})
				).body.group;
			});

			after(() => deleteRoom({ type: 'p', roomId: group._id }));

			it('should send a message as app user', (done) => {
				void request
					.post(apps(`/public/${app.id}/send-message-as-app-user`))
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
				expect(message.msg).to.be.equal('Executing send-message-as-app-user test endpoint');
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
					.post(apps(`/public/${app.id}/send-message-as-app-user`))
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
				expect(message.msg).to.be.equal('Executing send-message-as-app-user test endpoint');
			});
		});
	});
});
