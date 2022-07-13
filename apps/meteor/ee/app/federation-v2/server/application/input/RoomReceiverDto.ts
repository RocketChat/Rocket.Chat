import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

class BaseRoom {
	externalRoomId: string;

	normalizedRoomId: string;
}

export class FederationRoomChangeJoinRulesDto extends BaseRoom {
	roomType: RoomType;
}

export class FederationRoomChangeNameDto extends BaseRoom {
	normalizedRoomName: string;
}

export class FederationRoomChangeTopicDto extends BaseRoom {
	roomTopic: string;
}
