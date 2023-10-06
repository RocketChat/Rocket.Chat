import type { IUIActionButton } from '@rocket.chat/apps-engine/definition/ui';
import { RoomTypeFilter } from '@rocket.chat/apps-engine/definition/ui';
import type { IRoom } from '@rocket.chat/core-typings';
import {
	isDirectMessageRoom,
	isMultipleDirectMessageRoom,
	isOmnichannelRoom,
	isPrivateDiscussion,
	isPrivateTeamRoom,
	isPublicDiscussion,
	isPublicTeamRoom,
} from '@rocket.chat/core-typings';
import { AuthorizationContext, useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useContext } from 'react';

import { useRoom } from '../views/room/contexts/RoomContext';

const enumToFilter: { [k in RoomTypeFilter]: (room: IRoom) => boolean } = {
	[RoomTypeFilter.PUBLIC_CHANNEL]: (room) => room.t === 'c',
	[RoomTypeFilter.PRIVATE_CHANNEL]: (room) => room.t === 'p',
	[RoomTypeFilter.PUBLIC_TEAM]: isPublicTeamRoom,
	[RoomTypeFilter.PRIVATE_TEAM]: isPrivateTeamRoom,
	[RoomTypeFilter.PUBLIC_DISCUSSION]: isPublicDiscussion,
	[RoomTypeFilter.PRIVATE_DISCUSSION]: isPrivateDiscussion,
	[RoomTypeFilter.DIRECT]: isDirectMessageRoom,
	[RoomTypeFilter.DIRECT_MULTIPLE]: isMultipleDirectMessageRoom,
	[RoomTypeFilter.LIVE_CHAT]: isOmnichannelRoom,
};

const applyRoomFilter = (button: IUIActionButton, room: IRoom): boolean => {
	const { roomTypes } = button.when || {};
	return !roomTypes || roomTypes.some((filter): boolean => enumToFilter[filter]?.(room));
};

export const useApplyButtonFilters = (): ((button: IUIActionButton) => boolean) => {
	const room = useRoom();
	if (!room) {
		throw new Error('useApplyButtonFilters must be used inside a room context');
	}
	const applyAuthFilter = useApplyButtonAuthFilter();
	return useCallback(
		(button: IUIActionButton) => applyAuthFilter(button) && (!room || applyRoomFilter(button, room)),
		[applyAuthFilter, room],
	);
};

export const useApplyButtonAuthFilter = (): ((button: IUIActionButton) => boolean) => {
	const uid = useUserId();

	const { queryAllPermissions, queryAtLeastOnePermission, queryRole } = useContext(AuthorizationContext);

	return useCallback(
		(button: IUIActionButton, room?: IRoom) => {
			const { hasAllPermissions, hasOnePermission, hasAllRoles, hasOneRole } = button.when || {};

			const hasAllPermissionsResult = hasAllPermissions ? queryAllPermissions(hasAllPermissions)[1]() : true;
			const hasOnePermissionResult = hasOnePermission ? queryAtLeastOnePermission(hasOnePermission)[1]() : true;
			const hasAllRolesResult = hasAllRoles ? !!uid && hasAllRoles.every((role) => queryRole(role, room?._id)) : true;
			const hasOneRoleResult = hasOneRole ? !!uid && hasOneRole.some((role) => queryRole(role, room?._id)[1]()) : true;

			return hasAllPermissionsResult && hasOnePermissionResult && hasAllRolesResult && hasOneRoleResult;
		},
		[queryAllPermissions, queryAtLeastOnePermission, queryRole, uid],
	);
};
