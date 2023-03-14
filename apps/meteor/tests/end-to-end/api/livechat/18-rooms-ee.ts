/* eslint-env mocha */

import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import {
	createVisitor,
	createLivechatRoom,
	sendMessage,
	closeOmnichanelRoom,
	sendAgentMessage,
	placeRoomOnHold,
	getLivechatRoomInfo,
	startANewLivechatRoomAndTakeIt,
	makeAgentAvailable,
	createAgent,
} from '../../../data/livechat/rooms';
import { sleep } from '../../../data/livechat/utils';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[EE] LIVECHAT - rooms', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
		await createAgent();
		await makeAgentAvailable();
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

			const updatedRoom = await getLivechatRoomInfo(room._id);
			expect(updatedRoom.onHold).to.be.true;
		});
	});

	describe('livechat/room.resumeOnHold', () => {
		it('should fail if user doesnt have view-l-room permission', async () => {
			await updatePermission('view-l-room', []);
			const response = await request
				.post(api('livechat/room.resumeOnHold'))
				.set(credentials)
				.send({
					roomId: 'invalid-room-id',
				})
				.expect(403);

			expect(response.body.success).to.be.false;
		});
		it('should fail if roomId is invalid', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-manager', 'livechat-agent']);

			const response = await request
				.post(api('livechat/room.resumeOnHold'))
				.set(credentials)
				.send({
					roomId: 'invalid-room-id',
				})
				.expect(400);

			expect(response.body.success).to.be.false;
			expect(response.body.error).to.be.equal('error-invalid-room');
		});
		it('should fail if room is not a livechat room', async () => {
			const response = await request
				.post(api('livechat/room.resumeOnHold'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
				})
				.expect(400);

			expect(response.body.success).to.be.false;
			expect(response.body.error).to.be.equal('error-invalid-room');
		});

		it('should fail if room is not on hold', async () => {
			const { room } = await startANewLivechatRoomAndTakeIt();

			const response = await request
				.post(api('livechat/room.resumeOnHold'))
				.set(credentials)
				.send({
					roomId: room._id,
				})
				.expect(400);

			expect(response.body.success).to.be.false;
			expect(response.body.error).to.be.equal('error-room-not-on-hold');
		});
		it('should resume room on hold', async () => {
			const { room } = await startANewLivechatRoomAndTakeIt();

			await sendAgentMessage(room._id);
			await placeRoomOnHold(room._id);

			const response = await request
				.post(api('livechat/room.resumeOnHold'))
				.set(credentials)
				.send({
					roomId: room._id,
				})
				.expect(200);

			expect(response.body.success).to.be.true;

			const updatedRoom = await getLivechatRoomInfo(room._id);
			expect(updatedRoom).to.not.have.property('onHold');
		});
		it('should resume chat automatically if visitor sent a message', async () => {
			const { room, visitor } = await startANewLivechatRoomAndTakeIt();

			await sendAgentMessage(room._id);
			await placeRoomOnHold(room._id);
			await sendMessage(room._id, 'test', visitor.token);

			// wait for the room to be resumed since that logic is within callbacks
			await sleep(1000);

			const updatedRoom = await getLivechatRoomInfo(room._id);
			expect(updatedRoom).to.not.have.property('onHold');
		});
	});
});
