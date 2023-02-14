/* eslint-env mocha */

import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createVisitor, createLivechatRoom, sendMessage, closeRoom } from '../../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[EE] LIVECHAT - rooms', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(done);
	});

	describe('livechat/room.onHold', () => {
		it('should fail if user doesnt have on-hold-livechat-room permission', async () => {
			await updatePermission('on-hold-livechat-room', []);
			const response = await request
				.post(api('livechat/room.onHold'))
				.set(credentials)
				.send({
					roomId: 'invalid-room-id',
				})
				.expect(403);

			expect(response.body.success).to.be.false;
		});
		it('should fail if roomId is invalid', async () => {
			await updatePermission('on-hold-livechat-room', ['admin']);
			const response = await request
				.post(api('livechat/room.onHold'))
				.set(credentials)
				.send({
					roomId: 'invalid-room-id',
				})
				.expect(400);

			expect(response.body.success).to.be.false;
		});
		it('should fail if room is an empty string', async () => {
			const response = await request
				.post(api('livechat/room.onHold'))
				.set(credentials)
				.send({
					roomId: '                ',
				})
				.expect(400);

			expect(response.body.success).to.be.false;
		});
		it('should fail if room is not a livechat room', async () => {
			const response = await request
				.post(api('livechat/room.onHold'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
				})
				.expect(400);

			expect(response.body.success).to.be.false;
		});
		it('should fail if visitor is awaiting response (visitor sent last message)', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await sendMessage(room._id, 'test', visitor.token);

			const response = await request
				.post(api('livechat/room.onHold'))
				.set(credentials)
				.send({
					roomId: room._id,
				})
				.expect(400);

			expect(response.body.success).to.be.false;
		});
		it('should fail if room is closed', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await closeRoom(room._id);

			const response = await request
				.post(api('livechat/room.onHold'))
				.set(credentials)
				.send({
					roomId: room._id,
				})
				.expect(400);

			expect(response.body.success).to.be.false;
		});
		it('should fail if user is not serving the chat and doesnt have on-hold-others-livechat-room permission', async () => {
			await updatePermission('on-hold-others-livechat-room', []);
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			const response = await request
				.post(api('livechat/room.onHold'))
				.set(credentials)
				.send({
					roomId: room._id,
				})
				.expect(400);

			expect(response.body.success).to.be.false;
		});
		it('should put room on hold', async () => {
			await updatePermission('on-hold-others-livechat-room', ['admin', 'livechat-manager']);
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);

			const response = await request
				.post(api('livechat/room.onHold'))
				.set(credentials)
				.send({
					roomId: room._id,
				})
				.expect(200);

			expect(response.body.success).to.be.true;
		});
	});
});
