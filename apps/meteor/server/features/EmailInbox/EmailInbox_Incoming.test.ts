import { before, beforeEach, describe, it } from 'node:test';

import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import type { ILivechatRoomsModel, ILivechatVisitorsModel, IMessagesModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const models = {
	LivechatVisitors: { findOneGuestByEmailAddress: sinon.stub(), removeDepartmentById: sinon.stub() },
	LivechatRooms: { findOneByVisitorTokenAndEmailThreadAndDepartment: sinon.stub(), updateEmailThreadByRoomId: sinon.stub() },
	Messages: { updateOne: sinon.stub() },
};
const registerGuest = sinon.stub();
const setDepartmentForGuest = sinon.stub();
const unarchiveRoom = sinon.stub();
const sendMessage = sinon.stub();
const notifyOnMessageChange = sinon.stub();
const fileStore = { insert: sinon.stub() };

const { onEmailReceived } = proxyquire.noCallThru().load('./EmailInbox_Incoming', {
	'@rocket.chat/omni-core': { registerGuest },
	'./logger': { logger: { info: sinon.stub(), debug: sinon.stub(), error: sinon.stub() } },
	'../../lib/media/file-upload': {
		FileUpload: { getStore: () => fileStore, getPath: (path: string) => `/file-upload/${path}` },
	},
	'../../lib/notifyListener': { notifyOnMessageChange },
	'../../lib/omnichannel/QueueManager': { QueueManager: { unarchiveRoom } },
	'../../lib/omnichannel/departmentsLib': { setDepartmentForGuest },
	'../../lib/omnichannel/messages': { sendMessage },
	'../../settings': { settings: { get: sinon.stub() } },
});

const guest = { _id: 'visitor1', token: 'visitor-token', department: 'sales' };

const createEmail = (overrides: Record<string, unknown> = {}) => ({
	messageId: '<m2@mail>',
	inReplyTo: '<m1@mail>',
	references: ['<m0@mail>'],
	from: { text: 'Jane <jane@test>', value: [{ address: 'jane@test', name: 'Jane' }] },
	subject: 'Order',
	text: 'plain body',
	attachments: [],
	...overrides,
});

const createAttachment = (filename: string, contentType: string) => ({
	type: 'attachment',
	filename,
	contentType,
	size: 10,
	content: Buffer.from(filename),
});

// onEmailReceived does not wait for the message to be sent, so the tests flush the pending promises
const flush = () => new Promise(setImmediate);

const sentMessage = () => sendMessage.firstCall.args[0];

describe('onEmailReceived', () => {
	before(() => {
		registerModel('ILivechatVisitorsModel', models.LivechatVisitors as unknown as ILivechatVisitorsModel);
		registerModel('ILivechatRoomsModel', models.LivechatRooms as unknown as ILivechatRoomsModel);
		registerModel('IMessagesModel', models.Messages as unknown as IMessagesModel);
	});

	beforeEach(() => {
		for (const stub of [
			...Object.values(models).flatMap((model) => Object.values(model)),
			registerGuest,
			setDepartmentForGuest,
			unarchiveRoom,
			sendMessage,
			notifyOnMessageChange,
			fileStore.insert,
		]) {
			stub.reset();
		}
		models.LivechatVisitors.findOneGuestByEmailAddress.resolves({ ...guest });
		models.LivechatRooms.findOneByVisitorTokenAndEmailThreadAndDepartment.resolves({ _id: 'room1' });
		sendMessage.resolves();
	});

	it('should ignore an email without a sender address', async () => {
		await onEmailReceived(createEmail({ from: { text: '', value: [{ name: 'No address' }] } }), 'support@test', 'sales');

		expect(models.LivechatVisitors.findOneGuestByEmailAddress.called).to.be.false;
		expect(sendMessage.called).to.be.false;
	});

	it('should send the email to the visitor room found by its email thread', async () => {
		await onEmailReceived(createEmail({ references: ['<a@mail>,<b@mail>'] }), 'support@test', 'sales');

		const thread = ['<a@mail>', '<b@mail>', '<m2@mail>', '<m1@mail>'];
		expect(models.LivechatRooms.findOneByVisitorTokenAndEmailThreadAndDepartment.calledOnceWith('visitor-token', thread, 'sales')).to.be
			.true;
		const { guest: sentGuest, message, roomInfo } = sentMessage();
		expect(sentGuest).to.deep.equal(guest);
		expect(message).to.include({ rid: 'room1', msg: 'plain body', token: 'visitor-token', groupable: false });
		expect(message.email).to.deep.equal({ thread, messageId: '<m2@mail>' });
		expect(message.blocks[0].elements[0].text).to.equal('**From:** Jane <jane@test>\n**Subject:** Order');
		expect(message.attachments[0].actions[0]).to.include({ msgId: message._id, msg_processing_type: 'respondWithQuotedMessage' });
		expect(roomInfo).to.deep.equal({
			email: { inbox: 'support@test', thread, replyTo: 'jane@test', subject: 'Order' },
			source: { type: OmnichannelSourceType.EMAIL, id: 'support@test', alias: 'email-inbox' },
		});
	});

	it('should accept a single reference string', async () => {
		await onEmailReceived(createEmail({ references: '<a@mail>', inReplyTo: undefined }), 'support@test', 'sales');

		expect(sentMessage().message.email.thread).to.deep.equal(['<a@mail>', '<m2@mail>']);
	});

	it('should move an existing visitor to the inbox department', async () => {
		const movedGuest = { ...guest, department: 'support' };
		setDepartmentForGuest.resolves(movedGuest);

		await onEmailReceived(createEmail(), 'support@test', 'support');

		expect(setDepartmentForGuest.calledOnceWith({ visitorId: 'visitor1', department: 'support' })).to.be.true;
		expect(sentMessage().guest).to.equal(movedGuest);
	});

	it('should remove the visitor department when the inbox has none', async () => {
		await onEmailReceived(createEmail(), 'support@test');

		expect(models.LivechatVisitors.removeDepartmentById.calledOnceWith('visitor1')).to.be.true;
		expect(sentMessage().guest).to.not.have.property('department');
	});

	it('should register an unknown sender as a visitor named after the address when the email has no name', async () => {
		models.LivechatVisitors.findOneGuestByEmailAddress.resolves(null);
		registerGuest.resolves({ _id: 'visitor2', token: 'new-token' });

		await onEmailReceived(createEmail({ from: { text: 'new@test', value: [{ address: 'new@test', name: '' }] } }), 'support@test', 'sales');

		expect(registerGuest.firstCall.args[0]).to.include({ name: 'new@test', email: 'new@test', department: 'sales' });
		expect(sentMessage().message.token).to.equal('new-token');
	});

	it('should not send the email when the visitor cannot be registered', async () => {
		models.LivechatVisitors.findOneGuestByEmailAddress.resolves(null);
		registerGuest.resolves(null);

		await expect(onEmailReceived(createEmail(), 'support@test', 'sales')).to.be.rejectedWith('Error getting guest');
		expect(sendMessage.called).to.be.false;
	});

	it('should reopen a closed conversation and send the email to it', async () => {
		const closedRoom = { _id: 'room1', closedAt: new Date() };
		models.LivechatRooms.findOneByVisitorTokenAndEmailThreadAndDepartment.resolves(closedRoom);
		unarchiveRoom.resolves({ _id: 'room2' });

		await onEmailReceived(createEmail(), 'support@test', 'sales');

		expect(unarchiveRoom.calledOnceWith(closedRoom)).to.be.true;
		expect(sentMessage().message.rid).to.equal('room2');
	});

	it('should start a new room when no conversation matches the thread', async () => {
		models.LivechatRooms.findOneByVisitorTokenAndEmailThreadAndDepartment.resolves(null);

		await onEmailReceived(createEmail(), 'support@test', 'sales');

		expect(sentMessage().message.rid).to.be.a('string').and.not.equal('room1');
	});

	it('should use the HTML body as text with the link targets', async () => {
		await onEmailReceived(createEmail({ html: '<p>See <a href="https://docs.test">docs</a></p>' }), 'support@test', 'sales');

		expect(sentMessage().message.msg).to.equal('See docs (https://docs.test)');
	});

	it('should send an empty text when the email has no body', async () => {
		await onEmailReceived(createEmail({ text: undefined }), 'support@test', 'sales');

		expect(sentMessage().message.msg).to.equal('');
	});

	it('should add the uploaded files to the message', async () => {
		fileStore.insert.callsFake(async (details: { name: string; type: string; size: number }) => {
			if (details.name === 'broken.pdf') {
				throw new Error('upload failed');
			}
			return { _id: `file-${details.name}`, ...details };
		});
		const photo = createAttachment('photo.png', 'image/png');
		const attachments = [
			{ type: 'inline', filename: 'logo.png', contentType: 'image/png' },
			photo,
			createAttachment('voice.mp3', 'audio/mpeg'),
			createAttachment('clip.mp4', 'video/mp4'),
			createAttachment('broken.pdf', 'application/pdf'),
			createAttachment('notes.txt', 'text/plain'),
		];

		await onEmailReceived(createEmail({ attachments }), 'support@test', 'sales');
		await flush();

		expect(fileStore.insert.firstCall.args).to.deep.equal([
			{ name: 'photo.png', size: 10, type: 'image/png', rid: 'room1', visitorToken: 'visitor-token' },
			photo.content,
		]);
		const msgId = sentMessage().message._id;
		expect(models.Messages.updateOne.calledOnce).to.be.true;
		expect(models.Messages.updateOne.firstCall.args).to.deep.equal([
			{ _id: msgId },
			{
				$addToSet: {
					attachments: {
						$each: [
							{
								title: 'photo.png',
								title_link: '/file-upload/file-photo.png/photo.png',
								image_url: '/file-upload/file-photo.png/photo.png',
								image_type: 'image/png',
								image_size: 10,
								image_dimensions: undefined,
							},
							{
								title: 'voice.mp3',
								title_link: '/file-upload/file-voice.mp3/voice.mp3',
								audio_url: '/file-upload/file-voice.mp3/voice.mp3',
								audio_type: 'audio/mpeg',
								audio_size: 10,
							},
							{
								title: 'clip.mp4',
								title_link: '/file-upload/file-clip.mp4/clip.mp4',
								video_url: '/file-upload/file-clip.mp4/clip.mp4',
								video_type: 'video/mp4',
								video_size: 10,
							},
							{ title: 'notes.txt', title_link: '/file-upload/file-notes.txt/notes.txt' },
						],
					},
				},
			},
		]);
		expect(models.LivechatRooms.updateEmailThreadByRoomId.calledOnceWith('room1', sentMessage().message.email.thread)).to.be.true;
		expect(notifyOnMessageChange.calledOnceWith({ id: msgId })).to.be.true;
	});

	it('should not touch the message when the email has no files', async () => {
		await onEmailReceived(createEmail(), 'support@test', 'sales');
		await flush();

		expect(models.Messages.updateOne.called).to.be.false;
		expect(notifyOnMessageChange.called).to.be.false;
	});
});
