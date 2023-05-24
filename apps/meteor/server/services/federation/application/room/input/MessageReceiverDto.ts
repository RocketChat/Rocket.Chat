import type { IFederationReceiverBaseRoomInputDto } from './RoomReceiverDto';
import { FederationBaseRoomInputDto } from './RoomReceiverDto';

interface IFederationRoomMessageReactionInputDto extends IFederationReceiverBaseRoomInputDto {
	externalSenderId: string;
	externalEventId: string;
	externalReactedEventId: string;
	emoji: string;
}

export class FederationMessageReactionEventDto extends FederationBaseRoomInputDto {
	constructor({
		externalRoomId,
		normalizedRoomId,
		externalEventId,
		externalReactedEventId,
		emoji,
		externalSenderId,
	}: IFederationRoomMessageReactionInputDto) {
		super({ externalRoomId, normalizedRoomId, externalEventId });
		this.emoji = emoji;
		this.externalSenderId = externalSenderId;
		this.externalReactedEventId = externalReactedEventId;
	}

	emoji: string;

	externalSenderId: string;

	externalReactedEventId: string;
}
