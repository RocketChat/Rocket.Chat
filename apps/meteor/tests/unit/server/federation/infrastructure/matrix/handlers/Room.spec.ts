import { expect } from 'chai';
import sinon from 'sinon';

import { MatrixEventType } from '../../../../../../../server/services/federation/infrastructure/matrix/definitions/MatrixEventType';
import {
	MatrixEnumRelatesToRelType,
	MatrixEnumSendMessageType,
} from '../../../../../../../server/services/federation/infrastructure/matrix/definitions/events/RoomMessageSent';
import { MatrixRoomMessageSentHandler } from '../../../../../../../server/services/federation/infrastructure/matrix/handlers/Room';

describe('Federation - Infrastructure - handlers - Room - MatrixRoomMessageSentHandler ', () => {
	const normalMessageStub = sinon.stub();
	const editedMessageStub = sinon.stub();
	const fileMessageStub = sinon.stub();
	const threadMessageStub = sinon.stub();
	const threadFileMessageStub = sinon.stub();
	const roomService = {
		onExternalMessageReceived: normalMessageStub,
		onExternalFileMessageReceived: fileMessageStub,
		onExternalMessageEditedReceived: editedMessageStub,
		onExternalThreadedMessageReceived: threadMessageStub,
		onExternalThreadedFileMessageReceived: threadFileMessageStub,
	};
	const handler = new MatrixRoomMessageSentHandler(roomService as any);

	describe('#handle()', () => {
		const handlers: Record<string, any> = {
			[MatrixEnumSendMessageType.TEXT]: normalMessageStub,
			[MatrixEnumSendMessageType.AUDIO]: fileMessageStub,
			[MatrixEnumSendMessageType.FILE]: fileMessageStub,
			[MatrixEnumSendMessageType.IMAGE]: fileMessageStub,
			[MatrixEnumSendMessageType.NOTICE]: normalMessageStub,
			[MatrixEnumSendMessageType.VIDEO]: fileMessageStub,
			[MatrixEnumSendMessageType.EMOTE]: normalMessageStub,
		};

		Object.keys(handlers).forEach((type) => {
			it(`should call the correct handler for ${type}`, async () => {
				await handler.handle({ content: { body: '', msgtype: type, url: 'url', info: { mimetype: 'mime', size: 12 } } } as any);
				expect(handlers[type].called).to.be.true;
			});
		});

		it('should call the default handler if no handler is found', async () => {
			await handler.handle({ content: { body: '', msgtype: 'unknown', url: 'url', info: { mimetype: 'mime', size: 12 } } } as any);
			expect(normalMessageStub.called).to.be.true;
		});

		it('should throw an error if the msg type is location', async () => {
			await expect(
				handler.handle({ content: { body: '', msgtype: 'm.location', url: 'url', info: { mimetype: 'mime', size: 12 } } } as any),
			).to.be.rejectedWith('Location events are not supported yet');
		});

		it('should call the edit message method when it is an edition event', async () => {
			await handler.handle({
				content: {
					'msgtype': MatrixEnumSendMessageType.TEXT,
					'm.new_content': { body: '' },
					'm.relates_to': { rel_type: MatrixEnumRelatesToRelType.REPLACE },
				},
			} as any);
			expect(editedMessageStub.called).to.be.true;
		});

		describe('#threads', () => {
			const threadHandlers: Record<string, any> = {
				[MatrixEnumSendMessageType.TEXT]: threadMessageStub,
				[MatrixEnumSendMessageType.AUDIO]: threadFileMessageStub,
				[MatrixEnumSendMessageType.FILE]: threadFileMessageStub,
				[MatrixEnumSendMessageType.IMAGE]: threadFileMessageStub,
				[MatrixEnumSendMessageType.NOTICE]: threadMessageStub,
				[MatrixEnumSendMessageType.VIDEO]: threadFileMessageStub,
				[MatrixEnumSendMessageType.EMOTE]: threadMessageStub,
			};
			const threadContent = { 'm.relates_to': { rel_type: MatrixEventType.MESSAGE_ON_THREAD } };

			Object.keys(threadHandlers).forEach((type) => {
				it(`should call the correct handler for ${type} when the message event is inside a thread`, async () => {
					await handler.handle({
						content: { ...threadContent, body: '', msgtype: type, url: 'url', info: { mimetype: 'mime', size: 12 } },
					} as any);
					expect(threadHandlers[type].called).to.be.true;
				});
			});

			it('should call the default handler if no handler is found', async () => {
				await handler.handle({
					content: { ...threadContent, body: '', msgtype: 'unknown', url: 'url', info: { mimetype: 'mime', size: 12 } },
				} as any);
				expect(normalMessageStub.called).to.be.true;
			});

			it('should throw an error if the msg type is location', async () => {
				await expect(
					handler.handle({
						content: { ...threadContent, body: '', msgtype: 'm.location', url: 'url', info: { mimetype: 'mime', size: 12 } },
					} as any),
				).to.be.rejectedWith('Location events are not supported yet');
			});

			it('should call the edit message method when it is an edition event', async () => {
				await handler.handle({
					content: {
						...threadContent,
						'msgtype': MatrixEnumSendMessageType.TEXT,
						'm.new_content': { body: '' },
						'm.relates_to': { rel_type: MatrixEnumRelatesToRelType.REPLACE },
					},
				} as any);
				expect(editedMessageStub.called).to.be.true;
			});
		});
	});
});
