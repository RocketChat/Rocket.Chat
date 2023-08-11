import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data.js';
import { apps } from '../../data/apps/apps-data.js';
import { cleanupApps, installTestApp } from '../../data/apps/helper.js';
import { getMessageById } from '../../data/chat.helper.js';
import { createRoom } from '../../data/rooms.helper';

describe('Apps - Send Messages As APP User', function () {
	this.retries(0);
	let app;

	before((done) => getCredentials(done));
	before(async () => {
		await cleanupApps();
		app = await installTestApp();
	});

	describe('[Send Message as app user]', () => {
		it('should return an error when the room is not found', (done) => {
			request
				.post(apps(`/public/${app.id}/send-message-as-app-user`))
				.send({
					roomId: 'invalid-room',
				})
				.set(credentials)
				.expect(404)
				.expect((err, res) => {
					expect(err).to.have.a.property('error');
					expect(res).to.be.equal(undefined);
					expect(err.error).to.have.a.property('text');
					expect(err.error.text).to.be.equal('Room "invalid-room" could not be found');
				})
				.end(done);
		});
		describe('Send to a Public Channel', () => {
			let publicMessageId;
			it('should send a message as app user', (done) => {
				request
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
			let privateMessageId;
			it('should send a message as app user', (done) => {
				createRoom({
					type: 'p',
					name: `apps-e2etest-room-${Date.now()}`,
				}).end((err, createdRoom) => {
					request
						.post(apps(`/public/${app.id}/send-message-as-app-user`))
						.set(credentials)
						.send({
							roomId: createdRoom.body.group._id,
						})
						.expect(200)
						.expect((res) => {
							const response = JSON.parse(res.text);
							expect(response).to.have.a.property('messageId');
							privateMessageId = response.messageId;
						})
						.end(done);
				});
			});
			it('should be a valid message', async () => {
				const message = await getMessageById({ msgId: privateMessageId });
				expect(message.msg).to.be.equal('Executing send-message-as-app-user test endpoint');
			});
		});
		describe('Send to a DM Channel', () => {
			let DMMessageId;
			it('should send a message as app user', (done) => {
				createRoom({
					type: 'd',
					username: 'rocket.cat',
				}).end((err, createdRoom) => {
					request
						.post(apps(`/public/${app.id}/send-message-as-app-user`))
						.set(credentials)
						.send({
							roomId: createdRoom.body.room._id,
						})
						.expect(200)
						.expect((res) => {
							const response = JSON.parse(res.text);
							expect(response).to.have.a.property('messageId');
							DMMessageId = response.messageId;
						})
						.end(done);
				});
			});
			it('should be a valid message', async () => {
				const message = await getMessageById({ msgId: DMMessageId });
				expect(message.msg).to.be.equal('Executing send-message-as-app-user test endpoint');
			});
		});
	});
});
