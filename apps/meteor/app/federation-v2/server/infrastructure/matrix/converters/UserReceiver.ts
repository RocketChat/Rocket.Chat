import { FederationUserTypingStatusEventDto } from '../../../application/input/UserReceiverDto';
import type { MatrixEventUserTypingStatusChanged } from '../definitions/events/UserTypingStatusChanged';
import { convertExternalRoomIdToInternalRoomIdFormat } from './RoomReceiver';

export class MatrixUserReceiverConverter {
	public static toUserTypingDto(externalEvent: MatrixEventUserTypingStatusChanged): FederationUserTypingStatusEventDto {
		return new FederationUserTypingStatusEventDto({
			externalEventId: '',
			externalRoomId: externalEvent.room_id,
			externalUserIdsTyping: externalEvent.content.user_ids,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
		});
	}
}
