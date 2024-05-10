import emojione from 'emojione';

import { FederationMessageReactionEventDto } from '../../../../application/room/input/MessageReceiverDto';
import type { MatrixEventMessageReact } from '../../definitions/events/MessageReacted';
import { convertExternalRoomIdToInternalRoomIdFormat } from './RoomReceiver';

const convertEmojisMatrixFormatToRCFormat = (emoji: string): string => emojione.toShort(emoji);
export const convertEmojisFromRCFormatToMatrixFormat = (emoji: string): string => emojione.shortnameToUnicode(emoji);

export class MatrixMessageReceiverConverter {
	public static toMessageReactionDto(externalEvent: MatrixEventMessageReact): FederationMessageReactionEventDto {
		return new FederationMessageReactionEventDto({
			externalEventId: externalEvent.event_id,
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			externalSenderId: externalEvent.sender,
			emoji: convertEmojisMatrixFormatToRCFormat(externalEvent.content['m.relates_to'].key),
			externalReactedEventId: externalEvent.content['m.relates_to'].event_id,
		});
	}
}
