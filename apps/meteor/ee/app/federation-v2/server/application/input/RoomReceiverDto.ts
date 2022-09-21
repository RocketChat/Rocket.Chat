import type { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import type { IFederationReceiverBaseRoomInputDto } from '../../../../../../app/federation-v2/server/application/input/RoomReceiverDto';
import { FederationBaseRoomInputDto } from '../../../../../../app/federation-v2/server/application/input/RoomReceiverDto';

export interface IFederationCreateInputDto extends IFederationReceiverBaseRoomInputDto {
	roomType: RoomType;
}

export interface IFederationRoomNameChangeInputDto extends IFederationReceiverBaseRoomInputDto {
	normalizedRoomName: string;
}

export interface IFederationRoomChangeTopicInputDto extends IFederationReceiverBaseRoomInputDto {
	roomTopic: string;
}

export class FederationRoomChangeJoinRulesDto extends FederationBaseRoomInputDto {
	constructor({ roomType, externalRoomId, normalizedRoomId }: IFederationCreateInputDto) {
		super({ externalRoomId, normalizedRoomId });
		this.roomType = roomType;
	}

	roomType: RoomType;
}

export class FederationRoomChangeNameDto extends FederationBaseRoomInputDto {
	constructor({ externalRoomId, normalizedRoomId, normalizedRoomName }: IFederationRoomNameChangeInputDto) {
		super({ externalRoomId, normalizedRoomId });
		this.normalizedRoomName = normalizedRoomName;
	}

	normalizedRoomName: string;
}

export class FederationRoomChangeTopicDto extends FederationBaseRoomInputDto {
	constructor({ externalRoomId, normalizedRoomId, roomTopic }: IFederationRoomChangeTopicInputDto) {
		super({ externalRoomId, normalizedRoomId });
		this.roomTopic = roomTopic;
	}

	roomTopic: string;
}
