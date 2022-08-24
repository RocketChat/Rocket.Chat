import type { IRoom, IUser, ValueOf } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';

import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';

const allowedActionsInFederatedRooms: ValueOf<typeof RoomMemberActions>[] = [
	RoomMemberActions.REMOVE_USER,
	RoomMemberActions.INVITE,
	RoomMemberActions.JOIN,
	RoomMemberActions.LEAVE,
];

export const actionAllowed = (room: Partial<IRoom>, action: ValueOf<typeof RoomMemberActions>): boolean =>
	isDirectMessageRoom(room) && action === RoomMemberActions.REMOVE_USER ? false : allowedActionsInFederatedRooms.includes(action);

export const isEditableByTheUser = (user: IUser | undefined, room: IRoom | undefined): boolean => {
	if (!user || !room) {
		return false;
	}
	return user._id === room.u?._id;
};
