import type { IFederationReceiverBaseRoomInputDto } from './RoomReceiverDto';
import { FederationBaseRoomInputDto } from './RoomReceiverDto';

interface IFederationUserTypingStatusInputDto extends IFederationReceiverBaseRoomInputDto {
	externalUserIdsTyping: string[];
}

export class FederationUserTypingStatusEventDto extends FederationBaseRoomInputDto {
	constructor({ externalRoomId, normalizedRoomId, externalUserIdsTyping }: IFederationUserTypingStatusInputDto) {
		super({ externalRoomId, normalizedRoomId, externalEventId: '' });
		this.externalRoomId = externalRoomId;
		this.normalizedRoomId = normalizedRoomId;
		this.externalUserIdsTyping = externalUserIdsTyping;
	}

	externalUserIdsTyping: string[];
}
