import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IRoom, ValueOf } from '@rocket.chat/core-typings';

import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';

const allowedActionsInFederatedRooms: ValueOf<typeof RoomMemberActions>[] = [
	RoomMemberActions.REMOVE_USER,
	RoomMemberActions.INVITE,
	RoomMemberActions.JOIN,
	RoomMemberActions.LEAVE,
];

export const actionAllowed = (room: Partial<IRoom>, action: ValueOf<typeof RoomMemberActions>): boolean => {
	return room.t === RoomType.DIRECT_MESSAGE && action === RoomMemberActions.REMOVE_USER
		? false
		: allowedActionsInFederatedRooms.includes(action);
};
