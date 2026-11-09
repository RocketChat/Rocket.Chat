import { before, beforeEach, describe, it } from 'node:test';

import type { IMessage } from '@rocket.chat/core-typings';
import type { ILivechatRoomsModel, IMessagesModel, IRoomsModel, IUploadsModel, IUsersModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { createFakeMessage, createFakeUser } from '../../../tests/mocks/data';

const models = {
	Messages: { findOneById: sinon.stub(), updateOne: sinon.stub() },
	Uploads: { find: sinon.stub() },
	LivechatRooms: { updateEmailThreadByRoomId: sinon.stub() },
	Rooms: { findOneById: sinon.stub() },
	Users: { findOneById: sinon.stub() },
};
const inboxes = new Map();
const sendMessage = sinon.stub();
const notifyOnMessageChange = sinon.stub();
const getBuffer = sinon.stub();
const callbacksAdd = sinon.stub();
const slashCommandsAdd = sinon.stub();

const { sendTestEmailToInbox } = proxyquire.noCallThru().load('./EmailInbox_Outgoing', {
	'./EmailInbox': { inboxes },
	'./logger': { logger: { info: sinon.stub(), error: sinon.stub() } },
	'../../lib/callbacks': { callbacks: { add: callbacksAdd, priority: { LOW: 1 } } },
	'../../lib/media/file-upload': { FileUpload: { getBuffer } },
	'../../lib/messages/sendMessage': { sendMessage },
	'../../lib/notifyListener': { notifyOnMessageChange },
	'../../lib/utils/slashCommand': { slashCommands: { add: slashCommandsAdd } },
	'../../settings': { settings: { get: sinon.stub() } },
});

const [, replyByEmail] = callbacksAdd.firstCall.args;
const [{ callback: sendEmailAttachment }] = slashCommandsAdd.firstCall.args;

const rocketCat = createFakeUser({ _id: 'rocket.cat', username: 'rocket.cat' });
const agent = { _id: 'agent1', username: 'agent' };

const room = {
	_id: 'room1',
	email: { inbox: 'support@test', replyTo: 'jane@test', subject: 'Order', thread: ['<m1@mail>', '<m2@mail>'] },
};

const createInbox = () => ({
	smtp: { sendMail: sinon.stub().resolves({ messageId: '<reply@mail>' }) },
	config: { email: 'support@test', senderInfo: 'Support Team' },
});

const quote = (msgId: string, text: string) => `[ ](https://open.test/live/room1?msg=${msgId}) ${text}`;

const flush = () => new Promise(setImmediate);

const resetStubs = () => {
	for (const stub of [...Object.values(models).flatMap((model) => Object.values(model)), sendMessage, notifyOnMessageChange, getBuffer]) {
		stub.reset();
	}
	inboxes.clear();
	models.Users.findOneById.withArgs('rocket.cat').resolves(rocketCat);
};

describe('EmailInbox_Outgoing', () => {
	before(() => {
		registerModel('IMessagesModel', models.Messages as unknown as IMessagesModel);
		registerModel('IUploadsModel', models.Uploads as unknown as IUploadsModel);
		registerModel('ILivechatRoomsModel', models.LivechatRooms as unknown as ILivechatRoomsModel);
		registerModel('IRoomsModel', models.Rooms as unknown as IRoomsModel);
		registerModel('IUsersModel', models.Users as unknown as IUsersModel);
	});

	describe('reply by email', () => {
		let inbox: ReturnType<typeof createInbox>;
		const originalEmail = createFakeMessage({
			_id: 'original',
			msg: 'Where is my order?\nThanks',
			email: { messageId: '<m2@mail>', references: ['<m1@mail>'] },
		} as Partial<IMessage>);

		beforeEach(() => {
			resetStubs();
			inbox = createInbox();
			inboxes.set('support@test', inbox);
			models.Messages.findOneById.withArgs('original').resolves(originalEmail);
		});

		it('should leave messages from rooms without an email inbox unchanged', async () => {
			const message = createFakeMessage({ msg: quote('original', 'Hi') });

			expect(await replyByEmail(structuredClone(message), { room: { _id: 'room1' } })).to.deep.equal(message);
			expect(models.Users.findOneById.called).to.be.false;
		});

		it('should leave the message unchanged when the rocket.cat user does not exist', async () => {
			models.Users.findOneById.reset();
			const message = createFakeMessage({ msg: quote('original', 'Hi'), u: agent });

			expect(await replyByEmail(structuredClone(message), { room })).to.deep.equal(message);
			expect(inbox.smtp.sendMail.called).to.be.false;
		});

		it('should leave a message that quotes no email unchanged', async () => {
			const message = createFakeMessage({ msg: 'Just a chat message', u: agent });

			expect(await replyByEmail(structuredClone(message), { room })).to.deep.equal(message);
			expect(inbox.smtp.sendMail.called).to.be.false;
		});

		it('should offer to send the files of an agent message by email', async () => {
			const message = createFakeMessage({
				_id: 'withFiles',
				files: [{ _id: 'f1', name: 'a.pdf', type: 'application/pdf', format: 'PDF', size: 10 }],
				u: agent,
			});

			await replyByEmail(message, { room });

			const [sender, offer, offerRoom, options] = sendMessage.firstCall.args;
			expect(sender).to.equal(rocketCat);
			expect(offer.attachments[0].actions[0]).to.include({ msg: '/sendEmailAttachment withFiles', msg_processing_type: 'sendMessage' });
			expect(offerRoom).to.equal(room);
			expect(options).to.deep.equal({ upsert: true });
		});

		it('should not offer to send the files that rocket.cat posted', async () => {
			const message = createFakeMessage({
				files: [{ _id: 'f1', name: 'a.pdf', type: 'application/pdf', format: 'PDF', size: 10 }],
				u: { _id: 'rocket.cat', username: 'rocket.cat' },
			});

			await replyByEmail(message, { room });

			expect(sendMessage.called).to.be.false;
		});

		it('should email the quoted reply in the original thread and show it as an email', async () => {
			const message = createFakeMessage({ _id: 'reply', msg: quote('original', 'It ships today'), u: agent, urls: [] });

			const result = await replyByEmail(message, { room });
			await flush();

			expect(inbox.smtp.sendMail.calledOnce).to.be.true;
			expect(inbox.smtp.sendMail.firstCall.args[0]).to.deep.equal({
				from: { name: 'Support Team', address: 'support@test' },
				text: 'It ships today',
				inReplyTo: '<m2@mail>',
				references: ['<m1@mail>', '<m2@mail>'],
				to: 'jane@test',
				subject: 'Order',
			});
			expect(models.LivechatRooms.updateEmailThreadByRoomId.calledOnceWith('room1', '<reply@mail>')).to.be.true;
			expect(result).to.include({ msg: 'It ships today', groupable: false });
			expect(result).to.not.have.property('urls');
			expect(result.blocks.map((block: any) => block.text?.text ?? block.elements[0].text)).to.deep.equal([
				'**To:** jane@test\n**Subject:** Order',
				'It ships today',
				'> ---\n> Where is my order?\n> Thanks',
			]);
		});

		it('should send from the bare inbox address when it has no sender name', async () => {
			inbox.config.senderInfo = '';

			await replyByEmail(createFakeMessage({ msg: quote('original', 'Hi'), u: agent }), { room });

			expect(inbox.smtp.sendMail.firstCall.args[0].from).to.equal('support@test');
		});

		it('should not email a reply to a message that did not come by email', async () => {
			models.Messages.findOneById.withArgs('chat').resolves(createFakeMessage({ _id: 'chat' }));
			const message = createFakeMessage({ msg: quote('chat', 'Hi'), u: agent });

			expect(await replyByEmail(structuredClone(message), { room })).to.deep.equal(message);
			expect(inbox.smtp.sendMail.called).to.be.false;
		});

		it('should tell the agent when the inbox is not available', async () => {
			inboxes.clear();
			const message = createFakeMessage({ _id: 'reply', msg: quote('original', 'Hi'), u: agent });

			expect(await replyByEmail(structuredClone(message), { room })).to.deep.equal(message);

			const [sender, errorMessage, target] = sendMessage.firstCall.args;
			expect(sender).to.equal(rocketCat);
			expect(errorMessage).to.include({
				rid: 'room1',
				msg: '@agent something went wrong when replying email, sorry. **Error:**: Email inbox support@test not found or disabled.',
			});
			expect(target).to.deep.equal({ _id: 'room1' });
		});

		it('should tell the agent when the SMTP server rejects the reply', async () => {
			inbox.smtp.sendMail.rejects(new Error('550 mailbox unavailable'));

			await replyByEmail(createFakeMessage({ _id: 'reply', msg: quote('original', 'Hi'), u: agent }), { room });
			await flush();

			expect(sendMessage.firstCall.args[1].msg).to.equal(
				'@agent something went wrong when replying email, sorry. **Error:**: 550 mailbox unavailable',
			);
			expect(models.LivechatRooms.updateEmailThreadByRoomId.called).to.be.false;
		});
	});

	describe('/sendEmailAttachment', () => {
		let inbox: ReturnType<typeof createInbox>;
		const fileMessage = createFakeMessage({
			_id: 'fileMsg',
			rid: 'room1',
			u: agent,
			files: [
				{ _id: 'f1', name: 'a.pdf', type: 'application/pdf', format: 'PDF', size: 10 },
				{ _id: 'f2', name: 'b.png', type: 'image/png', format: 'PNG', size: 10 },
			],
			attachments: [{ description: 'Invoice' }, {}, { description: 'Photo' }],
		});
		const uploads = [
			{ _id: 'f1', name: 'a.pdf', type: 'application/pdf' },
			{ _id: 'f2', name: 'b.png', type: 'image/png' },
		];

		beforeEach(() => {
			resetStubs();
			inbox = createInbox();
			inboxes.set('support@test', inbox);
			models.Messages.findOneById.resolves(fileMessage);
			models.Rooms.findOneById.resolves(room);
			models.Uploads.find.returns({ toArray: async () => uploads });
			getBuffer.callsFake(async (file: { name: string }) => Buffer.from(file.name));
		});

		const run = () => sendEmailAttachment({ command: 'sendEmailAttachment', params: ' fileMsg ', message: {}, userId: 'agent1' });

		it('should email the message files in the room thread and confirm it to the agent', async () => {
			await run();
			await flush();

			expect(models.Messages.findOneById.calledOnceWith('fileMsg')).to.be.true;
			expect(inbox.smtp.sendMail.firstCall.args[0]).to.deep.equal({
				from: { name: 'Support Team', address: 'support@test' },
				to: 'jane@test',
				subject: 'Order',
				text: 'Invoice\n\nPhoto',
				attachments: [
					{ content: Buffer.from('a.pdf'), contentType: 'application/pdf', filename: 'a.pdf' },
					{ content: Buffer.from('b.png'), contentType: 'image/png', filename: 'b.png' },
				],
				inReplyTo: '<m1@mail>',
				references: ['<m1@mail>', '<m2@mail>'],
			});
			expect(models.LivechatRooms.updateEmailThreadByRoomId.calledOnceWith('room1', '<reply@mail>')).to.be.true;
			const [filter, update] = models.Messages.updateOne.firstCall.args;
			expect(filter).to.deep.equal({ _id: 'fileMsg' });
			expect(update.$set.blocks[0].elements[0].text).to.equal('**To:** jane@test\n**Subject:** Order');
			expect(update.$pull).to.deep.equal({ attachments: { 'actions.0.type': 'button' } });
			expect(notifyOnMessageChange.calledOnceWith({ id: 'fileMsg' })).to.be.true;
			expect(sendMessage.firstCall.args[0]).to.equal(rocketCat);
			expect(sendMessage.firstCall.args[1]).to.include({ rid: 'room1', msg: '@agent Attachment was sent successfully' });
		});

		it('should email only the files that still have content', async () => {
			getBuffer.withArgs(uploads[0]).resolves(undefined);

			await run();

			expect(inbox.smtp.sendMail.firstCall.args[0].attachments.map((a: { filename: string }) => a.filename)).to.deep.equal(['b.png']);
		});

		it('should email the single file of a message without a file list', async () => {
			models.Messages.findOneById.resolves({ ...fileMessage, files: undefined, file: { _id: 'f2', name: 'b.png', type: 'image/png' } });

			await run();

			expect(models.Uploads.find.calledOnceWith({ _id: { $in: ['f2'] } })).to.be.true;
		});

		it('should send nothing when no file has content', async () => {
			getBuffer.resolves(undefined);

			await run();

			expect(inbox.smtp.sendMail.called).to.be.false;
			expect(models.Messages.updateOne.called).to.be.false;
		});

		it('should send nothing for a message without files', async () => {
			models.Messages.findOneById.resolves(createFakeMessage({ rid: 'room1' }));

			await run();

			expect(models.Rooms.findOneById.called).to.be.false;
			expect(inbox.smtp.sendMail.called).to.be.false;
		});

		it('should send nothing when the message room is not an email conversation', async () => {
			models.Rooms.findOneById.resolves({ _id: 'room1' });

			await run();

			expect(inbox.smtp.sendMail.called).to.be.false;
			expect(sendMessage.called).to.be.false;
		});

		it('should tell the agent when the inbox is not available', async () => {
			inboxes.clear();

			await run();

			expect(sendMessage.firstCall.args[1].msg).to.equal(
				'@agent something went wrong when replying email, sorry. **Error:**: Email inbox support@test not found or disabled.',
			);
			expect(models.Uploads.find.called).to.be.false;
		});
	});

	describe('sendTestEmailToInbox', () => {
		const inboxRecord = { email: 'support@test' };

		beforeEach(resetStubs);

		it('should fail when the inbox is not running', async () => {
			await expect(sendTestEmailToInbox(inboxRecord, createFakeUser())).to.be.rejectedWith('inbox-not-found');
		});

		it('should fail when the user has no verified email address', async () => {
			const inbox = createInbox();
			inboxes.set('support@test', inbox);
			const user = createFakeUser({ emails: [{ address: 'admin@test', verified: false }] });

			await expect(sendTestEmailToInbox(inboxRecord, user)).to.be.rejectedWith('user-without-verified-email');
			expect(inbox.smtp.sendMail.called).to.be.false;
		});

		it('should send the test email to the first verified address of the user', async () => {
			const inbox = createInbox();
			inboxes.set('support@test', inbox);
			const user = createFakeUser({
				emails: [
					{ address: 'old@test', verified: false },
					{ address: 'admin@test', verified: true },
					{ address: 'other@test', verified: true },
				],
			});

			await sendTestEmailToInbox(inboxRecord, user);

			expect(inbox.smtp.sendMail.firstCall.args[0]).to.include({ to: 'admin@test', subject: 'Test of inbox configuration' });
		});
	});
});
