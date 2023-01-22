import type { IRoom, ISubscription, IUser, ValueOf } from '@rocket.chat/core-typings';
import { isRoomFederated, isDirectMessageRoom } from '@rocket.chat/core-typings';

import { RoomRoles } from '../../../app/models/client';
import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';

const allowedUserActionsInFederatedRooms: ValueOf<typeof RoomMemberActions>[] = [
	RoomMemberActions.REMOVE_USER,
	RoomMemberActions.SET_AS_OWNER,
	RoomMemberActions.SET_AS_MODERATOR,
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

	const myself = userSubscription.u?._id === showingUserId;
	const showingUserRoles = RoomRoles.findOne({ 'rid': room._id, 'u._id': showingUserId })?.roles;

	if (action === RoomMemberActions.REMOVE_USER && myself) {
		return false;
	}

	if (userSubscription.roles?.includes('owner')) {
		if (showingUserRoles?.includes('owner')) {
			if (action === RoomMemberActions.SET_AS_OWNER || action === RoomMemberActions.SET_AS_MODERATOR) {
				return myself;
			}
			if (action === RoomMemberActions.REMOVE_USER) {
				return false;
			}
		}

		if (showingUserRoles?.includes('moderator')) {
			if (action === RoomMemberActions.SET_AS_OWNER) {
				return true;
			}
			if (action === RoomMemberActions.SET_AS_MODERATOR) {
				return true;
			}
			return allowedUserActionsInFederatedRooms.includes(action);
		}

		return allowedUserActionsInFederatedRooms.includes(action);
	}

	if (userSubscription.roles?.includes('moderator')) {
		if (showingUserRoles?.includes('owner')) {
			return false;
		}

		if (showingUserRoles?.includes('moderator')) {
			if (action === RoomMemberActions.SET_AS_OWNER) {
				return false;
			}
			if (action === RoomMemberActions.SET_AS_MODERATOR) {
				return myself;
			}
			return false;
		}

		return action === RoomMemberActions.SET_AS_MODERATOR || action === RoomMemberActions.REMOVE_USER;
	}
	return false;
};

export const isEditableByTheUser = (user?: IUser, room?: IRoom, subscription?: ISubscription): boolean => {
	if (!user || !room || !subscription) {
		return false;
	}
	return Boolean(user._id === room.u?._id || subscription.roles?.includes('owner') || subscription.roles?.includes('moderator'));
};
