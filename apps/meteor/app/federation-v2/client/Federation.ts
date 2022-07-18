import { IRoom, IUser, ValueOf } from '@rocket.chat/core-typings';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

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

export const isEditableByTheUser = (user: IUser | undefined, room: IRoom | undefined): boolean => {
	if (!user || !room) {
		return false;
	}
	return user._id === room.u?._id;
};
