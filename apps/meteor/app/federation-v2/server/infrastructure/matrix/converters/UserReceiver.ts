import type { ExternalPresence, MatrixEventUserPresenceChanged } from '../definitions/events/UserPresenceChanged';
import { FederationUserPresenceEventDto, FederationUserTypingStatusEventDto } from '../../../application/input/UserReceiverDto';
import { MatrixEventUserTypingStatusChanged } from '../definitions/events/UserTypingStatusChanged';
import { convertExternalRoomIdToInternalRoomIdFormat } from './RoomReceiver';
import { UserStatus } from '@rocket.chat/core-typings';

const convertExternalPresenceToInternalPresence = (externalPresence: ExternalPresence): UserStatus => {
	const statusMap = {
		offline: UserStatus.OFFLINE,
		online: UserStatus.ONLINE,
		unavailable: UserStatus.AWAY,
	}
	if (!statusMap[externalPresence]) {
		return UserStatus.OFFLINE;
	}

	return statusMap[externalPresence];
}

export class MatrixUserReceiverConverter {
	public static toUserPresenceDto(externalEvent: MatrixEventUserPresenceChanged): FederationUserPresenceEventDto {
		return new FederationUserPresenceEventDto({
			externalSenderId: externalEvent.sender,
			currentlyActive: externalEvent.content.currently_active,
			lastActiveAgo: externalEvent.content.last_active_ago,
			presence: convertExternalPresenceToInternalPresence(externalEvent.content.presence),
			statusMessage: externalEvent.content.status_msg,
			avatarUrl: externalEvent.content.avatar_url,
		});
	}

	public static toUserTypingDto(externalEvent: MatrixEventUserTypingStatusChanged): FederationUserTypingStatusEventDto {
		return new FederationUserTypingStatusEventDto({
			externalEventId: '',
			externalRoomId: externalEvent.room_id,
			externalUserIdsTyping: externalEvent.content.user_ids,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
		});
	}
}
