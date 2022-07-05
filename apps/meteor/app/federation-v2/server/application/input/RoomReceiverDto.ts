import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { EVENT_ORIGIN } from '../../domain/IFederationBridge';

class BaseRoom {
	externalRoomId: string;

	normalizedRoomId: string;
}

export class FederationRoomCreateInputDto extends BaseRoom {
	externalInviterId: string;

	normalizedInviterId: string;

	wasInternallyProgramaticallyCreated?: boolean;

	externalRoomName?: string;

	roomType?: RoomType;
}

export class FederationRoomChangeMembershipDto extends BaseRoom {
	externalInviterId: string;

	normalizedInviterId: string;

	inviterUsernameOnly: string;

	externalInviteeId: string;

	normalizedInviteeId: string;

	inviteeUsernameOnly: string;

	roomType: RoomType;

	eventOrigin: EVENT_ORIGIN;

	leave?: boolean;

	externalRoomName?: string;
}

export class FederationRoomSendInternalMessageDto extends BaseRoom {
	externalSenderId: string;

	normalizedSenderId: string;

	text: string;
}
