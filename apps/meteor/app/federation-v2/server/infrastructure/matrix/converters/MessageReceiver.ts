import emoji-toolkit from 'emoji-toolkit';

import type { MatrixEventMessageReact } from '../definitions/events/MessageReacted';
import { FederationMessageReactionEventDto } from '../../../application/input/MessageReceiverDto';
import { convertExternalRoomIdToInternalRoomIdFormat } from './RoomReceiver';

const convertEmojisMatrixFormatToRCFormat = (emoji: string): string => emoji-toolkit.toShort(emoji);
export const convertEmojisRCFormatToMatrixFormat = (emoji: string): string => emoji-toolkit.shortnameToUnicode(emoji);

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
