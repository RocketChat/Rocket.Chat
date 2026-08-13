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

const applyCategoryFilter = (button: IUIActionButton, category: string): boolean => {
	const { category: buttonCategory } = button;

	if (category === 'default') {
		return !buttonCategory || buttonCategory === 'default';
	}

	return buttonCategory === category;
};

export const useApplyButtonFilters = (category = 'default'): ((button: IUIActionButton) => boolean) => {
	const room = useRoom();
	if (!room) {
		throw new Error('useApplyButtonFilters must be used inside a room context');
	}
	const applyAuthFilter = useApplyButtonAuthFilter();
	return useCallback(
		// The room is the scope of the role check: without it a role scoped to
		// `Subscriptions` — `owner`, `moderator`, `leader`, or a custom one — can never match.
		(button: IUIActionButton) => applyAuthFilter(button, room) && applyRoomFilter(button, room) && applyCategoryFilter(button, category),
		[applyAuthFilter, category, room],
	);
};

/**
 * Applies the `when` role and permission filters of an action button.
 *
 * `room` scopes the checks. A role scoped to `Subscriptions` is granted per room, so a
 * check for one only passes when it carries the room the button is rendered in; pass the
 * room on every room-bound surface. Surfaces with no room of their own — the user
 * dropdown, for instance — can only match roles scoped to `Users`.
 */
export const useApplyButtonAuthFilter = (): ((button: IUIActionButton, room?: IRoom) => boolean) => {
	const uid = useUserId();

	const { queryAllPermissions, queryAtLeastOnePermission, queryRole } = useContext(AuthorizationContext);

	return useCallback(
		(button: IUIActionButton, room?: IRoom) => {
			const { hasAllPermissions, hasOnePermission, hasAllRoles, hasOneRole } = button.when || {};

			const hasAllPermissionsResult = hasAllPermissions ? queryAllPermissions(hasAllPermissions)[1]() : true;
			const hasOnePermissionResult = hasOnePermission ? queryAtLeastOnePermission(hasOnePermission)[1]() : true;
			const hasAllRolesResult = hasAllRoles ? !!uid && hasAllRoles.every((role) => queryRole(role, room?._id)[1]()) : true;
			const hasOneRoleResult = hasOneRole ? !!uid && hasOneRole.some((role) => queryRole(role, room?._id)[1]()) : true;

			return hasAllPermissionsResult && hasOnePermissionResult && hasAllRolesResult && hasOneRoleResult;
		},
		[queryAllPermissions, queryAtLeastOnePermission, queryRole, uid],
	);
};
