import { faker } from '@faker-js/faker';
import type { ILivechatAgent, ILivechatVisitor, IOmnichannelRoom, IRoom, SettingValue } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { api, credentials, getCredentials, methodCall, request } from '../../../data/api-data';
import { sendSimpleMessage } from '../../../data/chat.helper';
import { imgURL } from '../../../data/interactions';
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
import { getSettingValueById, updateEESetting, updateSetting } from '../../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../../data/rooms.helper';

describe('LIVECHAT - messages', () => {
	let agent: ILivechatAgent;
	before((done) => getCredentials(done));

	before(async () => {
		agent = await createAgent();
		await makeAgentAvailable();
		await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
		await updateEESetting('Livechat_Require_Contact_Verification', 'never');
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

		describe('Multiple files per message', () => {
			let originalMaxFilesPerMessageValue: SettingValue;
			before(async () => {
				originalMaxFilesPerMessageValue = await getSettingValueById('FileUpload_MaxFilesPerMessage');
				await updateSetting('FileUpload_MaxFilesPerMessage', 2);
			});

			after(async () => {
				await updateSetting('FileUpload_MaxFilesPerMessage', originalMaxFilesPerMessageValue);
			});

			it('should return filesUpload array when message has files property', async () => {
				const {
					room: { _id: roomId },
					visitor: { token },
				} = await startANewLivechatRoomAndTakeIt();

				const file1Response = await request
					.post(api(`rooms.media/${roomId}`))
					.set(credentials)
					.attach('file', imgURL)
					.expect(200);
				const file2Response = await request
					.post(api(`rooms.media/${roomId}`))
					.set(credentials)
					.attach('file', imgURL)
					.expect(200);

				const uploadedFileIds = [file1Response.body.file._id, file2Response.body.file._id];
				const filesToConfirm = uploadedFileIds.map((id) => ({ _id: id, name: 'test.png' }));

				// send message with multiple files as agent
				const sendMessageResponse = await request
					.post(methodCall('sendMessage'))
					.set(credentials)
					.send({
						message: JSON.stringify({
							method: 'sendMessage',
							params: [{ _id: Random.id(), rid: roomId, msg: 'message with multiple files' }, [], filesToConfirm],
							id: 'id',
							msg: 'method',
						}),
					})
					.expect(200);

				const data = JSON.parse(sendMessageResponse.body.message);
				const fileMessage = data.result;

				// fetch message as visitor and verify filesUpload
				// note: image uploads also create thumbnails, so files.length may be > 2
				await request
					.get(api(`livechat/message/${fileMessage._id}`))
					.query({ token, rid: roomId })
					.send()
					.expect(200)
					.expect((res) => {
						const { message } = res.body;
						expect(message._id).to.be.equal(fileMessage._id);
						expect(message.file).to.be.an('object');
						expect(message.files).to.be.an('array').that.has.lengthOf(4);
						expect(message.fileUpload).to.be.an('object');
						expect(message.fileUpload.publicFilePath).to.be.a('string').and.not.empty;
						expect(message.fileUpload.type).to.be.a('string');
						expect(message.fileUpload.size).to.be.a('number');
						expect(message.filesUpload).to.be.an('array').with.lengthOf(message.files.length);
					});
			});
		});
	});
});
