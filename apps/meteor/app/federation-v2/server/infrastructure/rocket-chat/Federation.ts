import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IRoom, ValueOf } from '@rocket.chat/core-typings';

import { RoomMemberActions } from '../../../../../definition/IRoomTypeConfig';

const allowedActionsInFederatedRooms: ValueOf<typeof RoomMemberActions>[] = [
	RoomMemberActions.REMOVE_USER,
	RoomMemberActions.INVITE,
	RoomMemberActions.JOIN,
	RoomMemberActions.LEAVE,
];

export class Federation {
	public static isAFederatedRoom(room: IRoom): boolean {
		return room.federated === true;
	}

	public static actionAllowed(room: IRoom, action: ValueOf<typeof RoomMemberActions>): boolean {
		return room.t === RoomType.DIRECT_MESSAGE && action === RoomMemberActions.REMOVE_USER
			? false
			: allowedActionsInFederatedRooms.includes(action);
	}

	public static isAFederatedUsername(username: string): boolean {
		return username.includes('@') && username.includes(':');
	}
}
