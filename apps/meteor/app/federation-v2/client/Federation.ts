import { IRoom, IUser, ValueOf } from '@rocket.chat/core-typings';

import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';

const allowedActionsInFederatedRooms: ValueOf<typeof RoomMemberActions>[] = [
	RoomMemberActions.REMOVE_USER,
	RoomMemberActions.INVITE,
	RoomMemberActions.JOIN,
	RoomMemberActions.LEAVE,
];

export const actionAllowed = (action: ValueOf<typeof RoomMemberActions>): boolean => {
	return allowedActionsInFederatedRooms.includes(action);
};

export const canEdit = (user: IUser, room: IRoom): boolean => {
	return user._id === room.u?._id;
};
