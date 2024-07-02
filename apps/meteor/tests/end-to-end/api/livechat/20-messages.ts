import { faker } from '@faker-js/faker';
import type { ILivechatAgent, ILivechatVisitor, IOmnichannelRoom, IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { api, getCredentials, request } from '../../../data/api-data';
import { sendSimpleMessage } from '../../../data/chat.helper';
import {
	sendMessage,
	startANewLivechatRoomAndTakeIt,
	sendAgentMessage,
	createAgent,
	makeAgentAvailable,
	uploadFile,
	closeOmnichannelRoom,
} from '../../../data/livechat/rooms';
import { removeAgent } from '../../../data/livechat/users';
import { updateSetting } from '../../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../../data/rooms.helper';

describe('LIVECHAT - messages', () => {
	let agent: ILivechatAgent;
	before((done) => getCredentials(done));

	before(async () => {
		agent = await createAgent();
		await makeAgentAvailable();
		await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
	});

	after(() => Promise.all([updateSetting('Livechat_Routing_Method', 'Auto_Selection'), removeAgent(agent._id)]));

	describe('Quote message feature for visitors', () => {
		it('it should verify if visitor can quote message', async () => {
			const {
				room: { _id: roomId },
				visitor: { token },
			} = await startANewLivechatRoomAndTakeIt();

			await sendMessage(roomId, 'Hello from visitor', token);
			const agentMsgSentence = faker.lorem.sentence();
			const agentMsg = await sendAgentMessage(roomId, agentMsgSentence);

			const siteUrl = process.env.SITE_URL || process.env.TEST_API_URL || 'http://localhost:3000';

			const msgLink = `${siteUrl}/live/${roomId}?msg=${agentMsg._id}`;
			const quotedMsgSentence = faker.lorem.sentence();
			const wholeQuotedMsg = `[${msgLink}](${quotedMsgSentence})`;

			const quotedMessage = await sendMessage(roomId, wholeQuotedMsg, token);

			expect(quotedMessage).to.have.property('_id');
			expect(quotedMessage).to.have.property('msg').that.is.equal(wholeQuotedMsg);

			expect(quotedMessage).to.have.property('attachments');
			expect(quotedMessage.attachments).to.be.an('array').that.has.lengthOf(1);
			const quotedMessageAttachments = quotedMessage.attachments?.[0];
			if (quotedMessageAttachments) {
				expect(quotedMessageAttachments).to.have.property('message_link').that.is.equal(msgLink);
				expect(quotedMessageAttachments).to.have.property('text').that.is.equal(agentMsgSentence);
			}
		});

		it('should verify if visitor is receiving a message with a image attachment', async () => {
			const {
				room: { _id: roomId },
				visitor: { token },
			} = await startANewLivechatRoomAndTakeIt();

			const imgMessage = await uploadFile(roomId, token);

			expect(imgMessage).to.have.property('files').that.is.an('array');
			expect(imgMessage.files?.[0]).to.have.keys('_id', 'name', 'type');
			expect(imgMessage).to.have.property('file').that.deep.equal(imgMessage?.files?.[0]);
		});
	});

	describe('Livechat Messages', async () => {
		let room: IOmnichannelRoom;
		let privateRoom: IRoom;
		let visitor: ILivechatVisitor;

		before(async () => {
			await updateSetting('Livechat_Routing_Method', 'Auto_Selection');

			const data = await startANewLivechatRoomAndTakeIt();
			visitor = data.visitor;
			room = data.room;

			const response = await createRoom({ type: 'p', name: `private-room-${Math.random()}` } as any);
			privateRoom = response.body.group;
		});

		after(() => Promise.all([closeOmnichannelRoom(room._id), deleteRoom({ roomId: privateRoom._id, type: 'p' })]));

		it('should not allow fetching arbitrary messages from another channel', async () => {
			const response = await sendSimpleMessage({ roomId: privateRoom._id } as any);
			const { message } = response.body;

			await request
				.get(api(`livechat/message/${message._id}`))
				.query({ token: visitor.token, rid: room._id })
				.send()
				.expect(400)
				.expect((res) => {
					expect(res.body.error).to.be.equal('invalid-message');
				});
		});

		it('should allow fetching messages using their _id and roomId', async () => {
			const message = await sendMessage(room._id, 'Hello from visitor', visitor.token);

			await request
				.get(api(`livechat/message/${message._id}`))
				.query({ token: visitor.token, rid: room._id })
				.send()
				.expect(200)
				.expect((res) => {
					expect(res.body.message._id).to.be.equal(message._id);
				});
		});
	});
});
