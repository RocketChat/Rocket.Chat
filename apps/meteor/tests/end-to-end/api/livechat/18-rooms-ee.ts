/* eslint-env mocha */

import { expect } from 'chai';

import { getCredentials, api, request, credentials, methodCall } from '../../../data/api-data';
import {
	createVisitor,
	createLivechatRoom,
	sendMessage,
	closeOmnichanelRoom,
	setRoomOnHold,
	startANewLivechatRoomAndTakeIt,
	sendAgentMessage,
	unsetRoomOnHold,
	getLivechatRoomInfo,
	makeAgentAvailable,
	createAgent,
} from '../../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[EE] LIVECHAT - rooms', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
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
			await closeOmnichanelRoom(room._id);

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
		it('should remove room from hold', async () => {
			await updatePermission('on-hold-others-livechat-room', ['admin', 'livechat-manager']);
			const { room } = await startANewLivechatRoomAndTakeIt();
			await sendAgentMessage(room._id);
			await setRoomOnHold(room._id);
			const response = await request
				.post(methodCall('livechat:resumeOnHold'))
				.set(credentials)
				.send({ message: JSON.stringify({ params: [room._id], msg: 'method', method: 'livechat:resumeOnHold', id: 'id' }) })
				.expect(200);
			expect(response.body.success).to.be.true;
		});
		it('should not remove room from hold if room is not on hold', async () => {
			await updatePermission('on-hold-others-livechat-room', ['admin', 'livechat-manager']);
			const { room } = await startANewLivechatRoomAndTakeIt();
			await sendAgentMessage(room._id);
			const response = await request
				.post(methodCall('livechat:resumeOnHold'))
				.set(credentials)
				.send({ message: JSON.stringify({ params: [room._id], msg: 'method', method: 'livechat:resumeOnHold', id: 'id' }) })
				.expect(200);
			expect(response.body.success).to.be.true;
			expect(JSON.parse(response.body.message).error.reason).to.be.equal('Room is not OnHold');
		});
		it('should not remove room from hold if room does not exist', async () => {
			await updatePermission('on-hold-others-livechat-room', ['admin', 'livechat-manager']);
			const response = await unsetRoomOnHold('invalid-room-id');
			expect(response.body.success).to.be.true;
			expect(JSON.parse(response.body.message).error.reason).to.be.equal('Invalid room');
		});
		it('should change OnHold status of room when a visitor sends a message', async () => {
			await createAgent();
			await makeAgentAvailable();
			await updatePermission('on-hold-others-livechat-room', ['admin', 'livechat-manager']);
			const { room, visitor } = await startANewLivechatRoomAndTakeIt();
			await sendAgentMessage(room._id);
			await setRoomOnHold(room._id);
			await sendMessage(room._id, 'test', visitor.token);
			setTimeout(
				() =>
					getLivechatRoomInfo(room._id).then((info) => {
						expect(info.onHold).to.be.equal(undefined);
					}),
				500,
			);
		});
	});
});
