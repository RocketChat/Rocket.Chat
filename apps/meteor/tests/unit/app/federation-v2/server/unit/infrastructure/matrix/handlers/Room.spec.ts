import { expect } from 'chai';
import sinon from 'sinon';

import {
	MatrixEnumRelatesToRelType,
	MatrixEnumSendMessageType,
} from '../../../../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/events/RoomMessageSent';
import { MatrixRoomMessageSentHandler } from '../../../../../../../../../app/federation-v2/server/infrastructure/matrix/handlers/Room';

describe('Federation - Infrastructure - handlers - Room - MatrixRoomMessageSentHandler ', () => {
	const normalMessageStub = sinon.stub();
	const editedMessageStub = sinon.stub();
	const fileMessageStub = sinon.stub();
	const roomService = {
		onExternalMessageReceived: normalMessageStub,
		onExternalFileMessageReceived: fileMessageStub,
		onExternalMessageEditedReceived: editedMessageStub,
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub().returns('localDomain'),
	};
	const handler = new MatrixRoomMessageSentHandler(roomService as any, settingsAdapter as any);

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
	});
});
