import { expect } from 'chai';
import sinon from 'sinon';

import { getExternalMessageSender } from '../../../../../../../../server/services/federation/application/room/message/sender/message-sender-helper';
import { FederatedUser } from '../../../../../../../../server/services/federation/domain/FederatedUser';

describe('Federation - Application - Message Senders', () => {
	const bridge = {
		sendMessage: sinon.stub(),
		sendMessageFileToRoom: sinon.stub(),
		sendReplyToMessage: sinon.stub(),
		sendReplyMessageFileToRoom: sinon.stub(),
		sendThreadMessage: sinon.stub(),
		sendThreadReplyToMessage: sinon.stub(),
		sendMessageFileToThread: sinon.stub(),
		sendReplyMessageFileToThread: sinon.stub(),
	};
	const fileAdapter = {
		getBufferFromFileRecord: sinon.stub(),
		getFileRecordById: sinon.stub(),
		extractMetadataFromFile: sinon.stub(),
	};
	const messageAdapter = {
		setExternalFederationEventOnMessage: sinon.stub(),
		getMessageById: sinon.stub(),
	};
	const userAdapter = {
		getFederatedUserByInternalId: sinon.stub(),
	};

	afterEach(() => {
		bridge.sendMessage.reset();
		bridge.sendMessageFileToRoom.reset();
		bridge.sendReplyMessageFileToRoom.reset();
		bridge.sendThreadReplyToMessage.reset();
		bridge.sendMessageFileToThread.reset();
		bridge.sendReplyMessageFileToThread.reset();
		fileAdapter.getBufferFromFileRecord.reset();
		fileAdapter.getFileRecordById.reset();
		fileAdapter.extractMetadataFromFile.reset();
		messageAdapter.setExternalFederationEventOnMessage.reset();
		messageAdapter.getMessageById.reset();
		userAdapter.getFederatedUserByInternalId.reset();
	});

	describe('TextExternalMessageSender', () => {
		const roomId = 'roomId';
		const senderId = 'senderId';
		const message = { _id: '_id', msg: 'text' } as any;
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});

		describe('#sendMessage()', () => {
			it('should send a message through the bridge', async () => {
				bridge.sendMessage.resolves('externalMessageId');
				await getExternalMessageSender({
					message: {} as any,
					isThreadedMessage: false,
					bridge: bridge as any,
					internalFileAdapter: fileAdapter as any,
					internalMessageAdapter: messageAdapter as any,
					internalUserAdapter: userAdapter as any,
				}).sendMessage(roomId, senderId, message);
				expect(bridge.sendMessage.calledWith(roomId, senderId, message)).to.be.true;
				expect(messageAdapter.setExternalFederationEventOnMessage.calledWith(message._id, 'externalMessageId')).to.be.true;
			});
		});

		describe('#sendQuoteMessage()', () => {
			it('should send a quote message through the bridge', async () => {
				userAdapter.getFederatedUserByInternalId.resolves(user);
				bridge.sendReplyToMessage.resolves('externalMessageId');
				await getExternalMessageSender({
					message: {} as any,
					isThreadedMessage: false,
					bridge: bridge as any,
					internalFileAdapter: fileAdapter as any,
					internalMessageAdapter: messageAdapter as any,
					internalUserAdapter: userAdapter as any,
				}).sendQuoteMessage(roomId, senderId, message, { federation: { eventId: 'idToReplyTo' } } as any);
				expect(bridge.sendReplyToMessage.calledWith(roomId, senderId, 'idToReplyTo', user.getExternalId(), message.msg)).to.be.true;
				expect(messageAdapter.setExternalFederationEventOnMessage.calledWith(message._id, 'externalMessageId')).to.be.true;
			});
		});
	});

	describe('FileExternalMessageSender', () => {
		const roomId = 'roomId';
		const senderId = 'senderId';
		const message = { _id: '_id', msg: 'text', files: [{ _id: 'fileId' }] } as any;

		describe('#sendMessage()', () => {
			it('should not upload the file to the bridge if the file does not exists', async () => {
				fileAdapter.getFileRecordById.resolves(undefined);
				await getExternalMessageSender({
					message,
					isThreadedMessage: false,
					bridge: bridge as any,
					internalFileAdapter: fileAdapter as any,
					internalMessageAdapter: messageAdapter as any,
					internalUserAdapter: userAdapter as any,
				}).sendMessage(roomId, senderId, message);
				expect(bridge.sendMessageFileToRoom.called).to.be.false;
				expect(fileAdapter.getBufferFromFileRecord.called).to.be.false;
			});

			it('should not upload the file to the bridge if the file size does not exists', async () => {
				fileAdapter.getFileRecordById.resolves({});
				await getExternalMessageSender({
					message,
					isThreadedMessage: false,
					bridge: bridge as any,
					internalFileAdapter: fileAdapter as any,
					internalMessageAdapter: messageAdapter as any,
					internalUserAdapter: userAdapter as any,
				}).sendMessage(roomId, senderId, message);
				expect(bridge.sendMessageFileToRoom.called).to.be.false;
				expect(fileAdapter.getBufferFromFileRecord.called).to.be.false;
			});

			it('should not upload the file to the bridge if the file type does not exists', async () => {
				fileAdapter.getFileRecordById.resolves({ size: 12 });
				await getExternalMessageSender({
					message,
					isThreadedMessage: false,
					bridge: bridge as any,
					internalFileAdapter: fileAdapter as any,
					internalMessageAdapter: messageAdapter as any,
					internalUserAdapter: userAdapter as any,
				}).sendMessage(roomId, senderId, message);
				expect(bridge.sendMessageFileToRoom.called).to.be.false;
				expect(fileAdapter.getBufferFromFileRecord.called).to.be.false;
			});

			it('should send a message (upload the file) through the bridge', async () => {
				fileAdapter.getFileRecordById.resolves({ name: 'filename', size: 12, type: 'image/png' });
				fileAdapter.getBufferFromFileRecord.resolves({ buffer: 'buffer' });
				fileAdapter.extractMetadataFromFile.resolves({ width: 100, height: 100, format: 'png' });
				bridge.sendMessageFileToRoom.resolves('externalMessageId');
				await getExternalMessageSender({
					message,
					isThreadedMessage: false,
					bridge: bridge as any,
					internalFileAdapter: fileAdapter as any,
					internalMessageAdapter: messageAdapter as any,
					internalUserAdapter: userAdapter as any,
				}).sendMessage(roomId, senderId, message);
				expect(fileAdapter.getBufferFromFileRecord.calledWith({ name: 'filename', size: 12, type: 'image/png' })).to.be.true;
				expect(
					bridge.sendMessageFileToRoom.calledWith(
						roomId,
						senderId,
						{ buffer: 'buffer' },
						{
							filename: 'filename',
							fileSize: 12,
							mimeType: 'image/png',
							metadata: { width: 100, height: 100, format: 'png' },
						},
					),
				).to.be.true;
				expect(messageAdapter.setExternalFederationEventOnMessage.calledWith(message._id, 'externalMessageId')).to.be.true;
			});
		});

		describe('#sendQuoteMessage()', () => {
			it('should not upload the file to the bridge if the file does not exists', async () => {
				fileAdapter.getFileRecordById.resolves(undefined);
				await getExternalMessageSender({
					message,
					isThreadedMessage: false,
					bridge: bridge as any,
					internalFileAdapter: fileAdapter as any,
					internalMessageAdapter: messageAdapter as any,
					internalUserAdapter: userAdapter as any,
				}).sendQuoteMessage(roomId, senderId, message, { federation: { eventId: 'idToReplyTo' } } as any);
				expect(bridge.sendReplyMessageFileToRoom.called).to.be.false;
				expect(fileAdapter.getBufferFromFileRecord.called).to.be.false;
			});

			it('should not upload the file to the bridge if the file size does not exists', async () => {
				fileAdapter.getFileRecordById.resolves({});
				await getExternalMessageSender({
					message,
					isThreadedMessage: false,
					bridge: bridge as any,
					internalFileAdapter: fileAdapter as any,
					internalMessageAdapter: messageAdapter as any,
					internalUserAdapter: userAdapter as any,
				}).sendQuoteMessage(roomId, senderId, message, { federation: { eventId: 'idToReplyTo' } } as any);
				expect(bridge.sendMessageFileToRoom.called).to.be.false;
				expect(fileAdapter.getBufferFromFileRecord.called).to.be.false;
			});

			it('should not upload the file to the bridge if the file type does not exists', async () => {
				fileAdapter.getFileRecordById.resolves({ size: 12 });
				await getExternalMessageSender({
					message,
					isThreadedMessage: false,
					bridge: bridge as any,
					internalFileAdapter: fileAdapter as any,
					internalMessageAdapter: messageAdapter as any,
					internalUserAdapter: userAdapter as any,
				}).sendQuoteMessage(roomId, senderId, message, { federation: { eventId: 'idToReplyTo' } } as any);
				expect(bridge.sendReplyMessageFileToRoom.called).to.be.false;
				expect(fileAdapter.getBufferFromFileRecord.called).to.be.false;
			});

			it('should send a message (upload the file) through the bridge', async () => {
				fileAdapter.getFileRecordById.resolves({ name: 'filename', size: 12, type: 'image/png' });
				fileAdapter.getBufferFromFileRecord.resolves({ buffer: 'buffer' });
				fileAdapter.extractMetadataFromFile.resolves({ width: 100, height: 100, format: 'png' });
				bridge.sendReplyMessageFileToRoom.resolves('externalMessageId');
				await getExternalMessageSender({
					message,
					isThreadedMessage: false,
					bridge: bridge as any,
					internalFileAdapter: fileAdapter as any,
					internalMessageAdapter: messageAdapter as any,
					internalUserAdapter: userAdapter as any,
				}).sendQuoteMessage(roomId, senderId, message, { federation: { eventId: 'idToReplyTo' } } as any);
				expect(fileAdapter.getBufferFromFileRecord.calledWith({ name: 'filename', size: 12, type: 'image/png' })).to.be.true;
				expect(
					bridge.sendReplyMessageFileToRoom.calledWith(
						roomId,
						senderId,
						{ buffer: 'buffer' },
						{
							filename: 'filename',
							fileSize: 12,
							mimeType: 'image/png',
							metadata: { width: 100, height: 100, format: 'png' },
						},
						'idToReplyTo',
					),
				).to.be.true;
				expect(messageAdapter.setExternalFederationEventOnMessage.calledWith(message._id, 'externalMessageId')).to.be.true;
			});
		});
	});

	describe('#threads', () => {
		describe('ThreadTextExternalMessageSender', () => {
			const roomId = 'roomId';
			const senderId = 'senderId';
			const threadMessage = { _id: '_id', msg: 'text', tmid: 'tmid' } as any;
			const user = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: true,
			});

			describe('#sendMessage()', () => {
				it('should NOT send a message through the bridge if the message does not contain a thread id', async () => {
					await getExternalMessageSender({
						message: {} as any,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendMessage(roomId, senderId, threadMessage);
					expect(bridge.sendThreadMessage.called).to.be.false;
				});
				it('should NOT send a message through the bridge if the parent message does not exist', async () => {
					messageAdapter.getMessageById.resolves(undefined);
					await getExternalMessageSender({
						message: {} as any,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendMessage(roomId, senderId, threadMessage);
					expect(bridge.sendThreadMessage.called).to.be.false;
				});

				it('should send a message in the thread through the bridge', async () => {
					messageAdapter.getMessageById.resolves({ federation: { eventId: 'eventId' } } as any);
					bridge.sendThreadMessage.resolves('externalMessageId');
					await getExternalMessageSender({
						message: {} as any,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendMessage(roomId, senderId, threadMessage);
					expect(bridge.sendThreadMessage.calledWith(roomId, senderId, threadMessage, 'eventId')).to.be.true;
					expect(messageAdapter.setExternalFederationEventOnMessage.calledWith(threadMessage._id, 'externalMessageId')).to.be.true;
				});
			});

			describe('#sendQuoteMessage()', () => {
				it('should NOT send a message through the bridge if the message does not contain a thread id', async () => {
					await getExternalMessageSender({
						message: {} as any,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendQuoteMessage(roomId, senderId, threadMessage, { federation: { eventId: 'idToReplyTo' } } as any);
					expect(bridge.sendThreadReplyToMessage.called).to.be.false;
				});

				it('should NOT send a message through the bridge if the parent message does not exist', async () => {
					messageAdapter.getMessageById.resolves({ federation: { eventId: 'eventId' } } as any);
					messageAdapter.getMessageById.resolves(undefined);
					await getExternalMessageSender({
						message: {} as any,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendQuoteMessage(roomId, senderId, threadMessage, { federation: { eventId: 'idToReplyTo' } } as any);
					expect(bridge.sendThreadReplyToMessage.called).to.be.false;
				});

				it('should send a quote message in a thread through the bridge', async () => {
					messageAdapter.getMessageById.resolves({ federation: { eventId: 'eventId' } } as any);
					userAdapter.getFederatedUserByInternalId.resolves(user);
					bridge.sendThreadReplyToMessage.resolves('externalMessageId');
					await getExternalMessageSender({
						message: {} as any,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendQuoteMessage(roomId, senderId, threadMessage, {
						federation: { eventId: 'idToReplyTo' },
					} as any);
					expect(
						bridge.sendThreadReplyToMessage.calledWith(roomId, senderId, 'idToReplyTo', user.getExternalId(), threadMessage.msg, 'eventId'),
					).to.be.true;
					expect(messageAdapter.setExternalFederationEventOnMessage.calledWith(threadMessage._id, 'externalMessageId')).to.be.true;
				});
			});
		});

		describe('ThreadFileExternalMessageSender', () => {
			const roomId = 'roomId';
			const senderId = 'senderId';
			const threadMessage = { _id: '_id', msg: 'text', files: [{ _id: 'fileId' }], tmid: 'tmid' } as any;

			describe('#sendMessage()', () => {
				it('should NOT send a message through the bridge if the message does not contain a thread id', async () => {
					await getExternalMessageSender({
						message: {} as any,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendMessage(roomId, senderId, threadMessage);
					expect(bridge.sendMessageFileToThread.called).to.be.false;
				});
				it('should NOT send a message through the bridge if the parent message does not exist', async () => {
					messageAdapter.getMessageById.resolves(undefined);
					await getExternalMessageSender({
						message: threadMessage,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendMessage(roomId, senderId, threadMessage);
					expect(bridge.sendMessageFileToThread.called).to.be.false;
				});

				it('should not upload the file to the bridge if the file does not exists', async () => {
					messageAdapter.getMessageById.resolves({ federation: { eventId: 'eventId' } } as any);
					bridge.sendThreadMessage.resolves('externalMessageId');
					fileAdapter.getFileRecordById.resolves(undefined);
					await getExternalMessageSender({
						message: threadMessage,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendMessage(roomId, senderId, threadMessage);
					expect(bridge.sendMessageFileToThread.called).to.be.false;
					expect(fileAdapter.getBufferFromFileRecord.called).to.be.false;
				});

				it('should not upload the file to the bridge if the file size does not exists', async () => {
					messageAdapter.getMessageById.resolves({ federation: { eventId: 'eventId' } } as any);
					bridge.sendThreadMessage.resolves('externalMessageId');
					fileAdapter.getFileRecordById.resolves({});
					await getExternalMessageSender({
						message: threadMessage,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendMessage(roomId, senderId, threadMessage);
					expect(bridge.sendMessageFileToThread.called).to.be.false;
					expect(fileAdapter.getBufferFromFileRecord.called).to.be.false;
				});

				it('should not upload the file to the bridge if the file type does not exists', async () => {
					messageAdapter.getMessageById.resolves({ federation: { eventId: 'eventId' } } as any);
					bridge.sendThreadMessage.resolves('externalMessageId');
					fileAdapter.getFileRecordById.resolves({ size: 12 });
					await getExternalMessageSender({
						message: threadMessage,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendMessage(roomId, senderId, threadMessage);
					expect(bridge.sendMessageFileToThread.called).to.be.false;
					expect(fileAdapter.getBufferFromFileRecord.called).to.be.false;
				});

				it('should send a message (upload the file) in a thread through the bridge', async () => {
					messageAdapter.getMessageById.resolves({ federation: { eventId: 'eventId' } } as any);
					bridge.sendThreadMessage.resolves('externalMessageId');
					fileAdapter.getFileRecordById.resolves({ name: 'filename', size: 12, type: 'image/png' });
					fileAdapter.getBufferFromFileRecord.resolves({ buffer: 'buffer' });
					fileAdapter.extractMetadataFromFile.resolves({ width: 100, height: 100, format: 'png' });
					bridge.sendMessageFileToThread.resolves('externalMessageId');
					await getExternalMessageSender({
						message: threadMessage,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendMessage(roomId, senderId, threadMessage);
					expect(fileAdapter.getBufferFromFileRecord.calledWith({ name: 'filename', size: 12, type: 'image/png' })).to.be.true;
					expect(
						bridge.sendMessageFileToThread.calledWith(
							roomId,
							senderId,
							{ buffer: 'buffer' },
							{
								filename: 'filename',
								fileSize: 12,
								mimeType: 'image/png',
								metadata: { width: 100, height: 100, format: 'png' },
							},
						),
						'eventId',
					).to.be.true;
					expect(messageAdapter.setExternalFederationEventOnMessage.calledWith(threadMessage._id, 'externalMessageId')).to.be.true;
				});
			});

			describe('#sendQuoteMessage()', () => {
				it('should NOT send a message through the bridge if the message does not contain a thread id', async () => {
					await getExternalMessageSender({
						message: {} as any,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendQuoteMessage(roomId, senderId, threadMessage, { federation: { eventId: 'idToReplyTo' } } as any);
					expect(bridge.sendReplyMessageFileToThread.called).to.be.false;
				});
				it('should NOT send a message through the bridge if the parent message does not exist', async () => {
					messageAdapter.getMessageById.resolves(undefined);
					await getExternalMessageSender({
						message: threadMessage,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendQuoteMessage(roomId, senderId, threadMessage, { federation: { eventId: 'idToReplyTo' } } as any);
					expect(bridge.sendReplyMessageFileToThread.called).to.be.false;
				});

				it('should not upload the file to the bridge if the file does not exists', async () => {
					messageAdapter.getMessageById.resolves({ federation: { eventId: 'eventId' } } as any);
					fileAdapter.getFileRecordById.resolves(undefined);
					await getExternalMessageSender({
						message: threadMessage,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendQuoteMessage(roomId, senderId, threadMessage, { federation: { eventId: 'idToReplyTo' } } as any);
					expect(bridge.sendReplyMessageFileToThread.called).to.be.false;
					expect(fileAdapter.getBufferFromFileRecord.called).to.be.false;
				});

				it('should not upload the file to the bridge if the file size does not exists', async () => {
					messageAdapter.getMessageById.resolves({ federation: { eventId: 'eventId' } } as any);
					fileAdapter.getFileRecordById.resolves({});
					await getExternalMessageSender({
						message: threadMessage,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendQuoteMessage(roomId, senderId, threadMessage, { federation: { eventId: 'idToReplyTo' } } as any);
					expect(bridge.sendReplyMessageFileToThread.called).to.be.false;
					expect(fileAdapter.getBufferFromFileRecord.called).to.be.false;
				});

				it('should not upload the file to the bridge if the file type does not exists', async () => {
					messageAdapter.getMessageById.resolves({ federation: { eventId: 'eventId' } } as any);
					fileAdapter.getFileRecordById.resolves({ size: 12 });
					await getExternalMessageSender({
						message: threadMessage,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendQuoteMessage(roomId, senderId, threadMessage, { federation: { eventId: 'idToReplyTo' } } as any);
					expect(bridge.sendReplyMessageFileToThread.called).to.be.false;
					expect(fileAdapter.getBufferFromFileRecord.called).to.be.false;
				});

				it('should send a message (upload the file) through the bridge', async () => {
					messageAdapter.getMessageById.resolves({ federation: { eventId: 'eventId' } } as any);
					fileAdapter.getFileRecordById.resolves({ name: 'filename', size: 12, type: 'image/png' });
					fileAdapter.getBufferFromFileRecord.resolves({ buffer: 'buffer' });
					fileAdapter.extractMetadataFromFile.resolves({ width: 100, height: 100, format: 'png' });
					bridge.sendReplyMessageFileToThread.resolves('externalMessageId');
					await getExternalMessageSender({
						message: threadMessage,
						isThreadedMessage: true,
						bridge: bridge as any,
						internalFileAdapter: fileAdapter as any,
						internalMessageAdapter: messageAdapter as any,
						internalUserAdapter: userAdapter as any,
					}).sendQuoteMessage(roomId, senderId, threadMessage, { federation: { eventId: 'idToReplyTo' } } as any);
					expect(fileAdapter.getBufferFromFileRecord.calledWith({ name: 'filename', size: 12, type: 'image/png' })).to.be.true;
					expect(
						bridge.sendReplyMessageFileToThread.calledWith(
							roomId,
							senderId,
							{ buffer: 'buffer' },
							{
								filename: 'filename',
								fileSize: 12,
								mimeType: 'image/png',
								metadata: { width: 100, height: 100, format: 'png' },
							},
							'idToReplyTo',
							'eventId',
						),
					).to.be.true;
					expect(messageAdapter.setExternalFederationEventOnMessage.calledWith(threadMessage._id, 'externalMessageId')).to.be.true;
				});
			});
		});
	});
});
