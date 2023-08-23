import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createLivechatRoom, createVisitor, fetchMessages, sendMessage } from '../../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - WebRTC video call', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await updateSetting('Livechat_accept_chats_with_no_agents', true);
	});

	describe('livechat/webrtc.call', () => {
		it('should fail if user doesnt have view-l-room permission', async () => {
			await updatePermission('view-l-room', []);
			const response = await request.get(api('livechat/webrtc.call')).set(credentials).query({
				rid: 'invalid-room',
			});
			expect(response.statusCode).to.be.equal(403);
			await updatePermission('view-l-room', ['user', 'bot', 'livechat-agent', 'admin']);
		});
		it('should fail if room doesnt exists', async () => {
			const response = await request.get(api('livechat/webrtc.call')).set(credentials).query({
				rid: 'invalid-room',
			});
			expect(response.statusCode).to.be.equal(400);
		});
		it('should fail if WebRTC_Enabled setting is set to false', async () => {
			await updateSetting('WebRTC_Enabled', false);
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const response = await request.get(api('livechat/webrtc.call')).set(credentials).query({
				rid: room._id,
			});
			expect(response.statusCode).to.be.equal(400);
			await updateSetting('WebRTC_Enabled', true);
		});
		it('should fail if WebRTC_Enabled is true but Omnichannel_call_provider setting is not WebRTC', async () => {
			await updateSetting('Omnichannel_call_provider', 'default-provider');
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const response = await request.get(api('livechat/webrtc.call')).set(credentials).query({
				rid: room._id,
			});
			expect(response.statusCode).to.be.equal(400);
			await updateSetting('Omnichannel_call_provider', 'WebRTC');
		});
		it('should return callStatus as "ringing" when room doesnt have any active call', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const response = await request.get(api('livechat/webrtc.call')).set(credentials).query({
				rid: room._id,
			});
			expect(response.statusCode).to.be.equal(200);
			expect(response.body).to.have.a.property('videoCall').that.is.an('object');
			expect(response.body.videoCall).to.have.property('callStatus', 'ringing');
			expect(response.body.videoCall).to.have.property('provider', 'webrtc');
		});
	});
	describe('livechat/webrtc.call/:callId', () => {
		it('should fail if user doesnt have view-l-room permission', async () => {
			await updatePermission('view-l-room', []);
			const response = await request
				.put(api('livechat/webrtc.call/invalid-call'))
				.send({ rid: 'fasd', status: 'invalid' })
				.set(credentials);
			expect(response.statusCode).to.be.equal(403);
			await updatePermission('view-l-room', ['user', 'bot', 'livechat-agent', 'admin']);
		});
		it('should fail if room doesnt exists', async () => {
			const response = await request
				.put(api('livechat/webrtc.call/invalid-call'))
				.send({ rid: 'invalid', status: 'invalid' })
				.set(credentials);
			expect(response.statusCode).to.be.equal(400);
		});
		it('should fail when rid is good, but callId is invalid', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const response = await request
				.put(api('livechat/webrtc.call/invalid-call'))
				.send({ rid: room._id, status: 'invalid' })
				.set(credentials);
			expect(response.statusCode).to.be.equal(400);
		});
		it('should fail when callId points to a message but message is not of type livechat_webrtc_video_call', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const message = await sendMessage(room._id, 'This is a test message', visitor.token);
			const response = await request
				.put(api(`livechat/webrtc.call/${message._id}`))
				.send({ rid: room._id, status: 'invalid' })
				.set(credentials);
			expect(response.statusCode).to.be.equal(400);
		});
		it('should update the call status when all params and room are good', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			// Start call
			await request
				.get(api('livechat/webrtc.call'))
				.set(credentials)
				.query({
					rid: room._id,
				})
				.expect(200);
			const messages = await fetchMessages(room._id, visitor.token);
			const callMessage = messages.find((message) => message.t === 'livechat_webrtc_video_call');
			expect(callMessage).to.be.an('object');
			const response = await request
				.put(api(`livechat/webrtc.call/${callMessage?._id}`))
				.send({ rid: room._id, status: 'invalid' })
				.set(credentials);
			expect(response.statusCode).to.be.equal(200);
			expect(response.body).to.have.a.property('status', 'invalid');
		});
	});
});
