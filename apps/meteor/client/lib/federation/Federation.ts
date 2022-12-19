import type { IRoom, ISubscription, IUser, ValueOf } from '@rocket.chat/core-typings';
import { isRoomFederated, isDirectMessageRoom } from '@rocket.chat/core-typings';

import { RoomRoles } from '../../../app/models/client';
import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';

const allowedActionsInFederatedRooms: ValueOf<typeof RoomMemberActions>[] = [
	RoomMemberActions.REMOVE_USER,
	RoomMemberActions.SET_AS_OWNER,
	RoomMemberActions.SET_AS_MODERATOR,
	RoomMemberActions.INVITE,
	RoomMemberActions.JOIN,
	RoomMemberActions.LEAVE,
];

export const actionAllowed = (
	room: Partial<IRoom>,
	action: ValueOf<typeof RoomMemberActions>,
	showingUserId: IUser['_id'],
	userSubscription?: ISubscription,
): boolean => {
	if (!isRoomFederated(room)) {
		return false;
	}
	if (isDirectMessageRoom(room)) {
		return false;
	}
	if (!userSubscription) {
		return false;
	}

	const isTheOwner = room.u?._id === showingUserId;

	if (isTheOwner) {
		return false;
	}

	if (action === RoomMemberActions.SET_AS_OWNER && !userSubscription.roles?.includes('owner')) {
		return false;
	}

	if (action === RoomMemberActions.SET_AS_MODERATOR) {
		return (
			Boolean(userSubscription.roles?.includes('owner')) ||
			(Boolean(userSubscription.roles?.includes('moderator')) &&
				RoomRoles.findOne({ 'rid': room._id, 'u._id': showingUserId, 'roles': 'moderator' }) === undefined)
		);
	}

	return Boolean(
		(userSubscription?.roles?.includes('owner') || userSubscription?.roles?.includes('moderator')) &&
			allowedActionsInFederatedRooms.includes(action),
	);
};

export const isEditableByTheUser = (user?: IUser, room?: IRoom, subscription?: ISubscription): boolean => {
	if (!user || !room || !subscription) {
		return false;
	}
	return Boolean(user._id === room.u?._id || subscription.roles?.includes('owner') || subscription.roles?.includes('moderator'));
};
