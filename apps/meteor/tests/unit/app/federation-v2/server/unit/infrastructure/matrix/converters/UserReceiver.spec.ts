import { expect } from 'chai';

import { MatrixUserReceiverConverter } from '../../../../../../../../../app/federation-v2/server/infrastructure/matrix/converters/UserReceiver';
import { FederationUserTypingStatusEventDto } from '../../../../../../../../../app/federation-v2/server/application/input/UserReceiverDto';

describe('Federation - Infrastructure - Matrix - MatrixUserReceiverConverter', () => {
	describe('#toUserTypingDto()', () => {
		const event = {
			content: { user_ids: ['id'] },
			room_id: '!roomId:matrix.org',
		};

		it('should return an instance of FederationUserTypingStatusEventDto', () => {
			expect(MatrixUserReceiverConverter.toUserTypingDto(event as any)).to.be.instanceOf(FederationUserTypingStatusEventDto);
		});

		it('should convert the event properly', () => {
			const result = MatrixUserReceiverConverter.toUserTypingDto(event as any);
			expect(result).to.be.eql({
				externalEventId: '',
				externalRoomId: event.room_id,
				externalUserIdsTyping: event.content.user_ids,
				normalizedRoomId: 'roomId',
			});
		});
	});
});
