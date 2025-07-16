import type { IRoom, ISubscription, IUser, ValueOf } from '@rocket.chat/core-typings';
import { isRoomFederated, isDirectMessageRoom, isPublicRoom } from '@rocket.chat/core-typings';

import { RoomMemberActions, RoomSettingsEnum } from '../../../definition/IRoomTypeConfig';
import type { RoomRoles } from '../../hooks/useRoomRolesQuery';
import { queryClient } from '../queryClient';
import { roomsQueryKeys } from '../queryKeys';

const allowedUserActionsInFederatedRooms: ValueOf<typeof RoomMemberActions>[] = [
	RoomMemberActions.REMOVE_USER,
	RoomMemberActions.SET_AS_OWNER,
	RoomMemberActions.SET_AS_MODERATOR,
];

const allowedRoomSettingsChangesInFederatedRooms: ValueOf<typeof RoomSettingsEnum>[] = [RoomSettingsEnum.NAME, RoomSettingsEnum.TOPIC];

export const actionAllowed = (
	room: Partial<IRoom>,
	action: ValueOf<typeof RoomMemberActions>,
	displayingUserId: IUser['_id'],
	userSubscription?: ISubscription,
): boolean => {
	if (!isRoomFederated(room)) {
		return false;
	}

	if (isDirectMessageRoom(room)) {
		return false;
	}

	const subscribed = Boolean(userSubscription);
	const defaultUser = !userSubscription?.roles;
	if (!subscribed || defaultUser) {
		return false;
	}

	const myself = userSubscription.u?._id === displayingUserId;
	const removingMyself = action === RoomMemberActions.REMOVE_USER && myself;

	if (removingMyself) {
		return false;
	}

	// TODO: there is no guarantee that the room roles are already loaded
	const displayingUserRoomRoles =
		queryClient
			.getQueryData<RoomRoles[]>(roomsQueryKeys.roles(room._id))
			?.find((record) => record.rid === room._id && record.u._id === displayingUserId)?.roles || [];
	const loggedInUserRoomRoles = userSubscription.roles || [];

	if (loggedInUserRoomRoles.includes('owner')) {
		if (action === RoomMemberActions.SET_AS_OWNER || action === RoomMemberActions.SET_AS_MODERATOR) {
			return displayingUserRoomRoles.includes('owner') ? myself : true;
		}

		if (action === RoomMemberActions.REMOVE_USER) {
			return !displayingUserRoomRoles.includes('owner');
		}
		const allowedForOwnersOverDefaultUsers = allowedUserActionsInFederatedRooms.includes(action);

		return allowedForOwnersOverDefaultUsers;
	}

	if (loggedInUserRoomRoles.includes('moderator')) {
		if (displayingUserRoomRoles.includes('owner')) {
			return false;
		}

		if (displayingUserRoomRoles.includes('moderator')) {
			if (action === RoomMemberActions.SET_AS_MODERATOR) {
				return myself;
			}
			return false;
		}

		const allowedForModeratorsOverDefaultUsers = action === RoomMemberActions.SET_AS_MODERATOR || action === RoomMemberActions.REMOVE_USER;

		return allowedForModeratorsOverDefaultUsers;
	}

	return false;
};

export const isEditableByTheUser = (user?: IUser, room?: IRoom, subscription?: ISubscription): boolean => {
	if (!user || !room || !subscription) {
		return false;
	}
	return isRoomFederated(room) && Boolean(subscription.roles?.includes('owner') || subscription.roles?.includes('moderator'));
};

export const canCreateInviteLinks = (user?: IUser, room?: IRoom, subscription?: ISubscription): boolean => {
	if (!user || !room || !subscription) {
		return false;
	}
	return (
		isRoomFederated(room) &&
		isPublicRoom(room) &&
		Boolean(subscription.roles?.includes('owner') || subscription.roles?.includes('moderator'))
	);
};

export const isRoomSettingAllowed = (room: Partial<IRoom>, setting: ValueOf<typeof RoomSettingsEnum>): boolean => {
	if (!isRoomFederated(room)) {
		return false;
	}

	if (isDirectMessageRoom(room)) {
		return false;
	}
	return allowedRoomSettingsChangesInFederatedRooms.includes(setting);
};
