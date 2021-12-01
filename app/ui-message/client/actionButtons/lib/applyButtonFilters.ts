/* Style disabled as having some arrow functions in one-line hurts readability */
/* eslint-disable arrow-body-style */

import { Meteor } from 'meteor/meteor';
import { IUIActionButton, TemporaryRoomTypeFilter } from '@rocket.chat/apps-engine/definition/ui';

import { hasAtLeastOnePermission, hasPermission, hasRole } from '../../../../authorization/client';
import {
	IRoom,
	isDirectMessageRoom,
	isMultipleDirectMessageRoom,
	isOmnichannelRoom,
	isPrivateDiscussion,
	isPrivateTeamRoom,
	isPublicDiscussion,
	isPublicTeamRoom,
} from '../../../../../definition/IRoom';

export const applyAuthFilter = (button: IUIActionButton, room?: IRoom): boolean => {
	const { hasAllPermissions, hasOnePermission, hasAllRoles, hasOneRole } = button.when || {};

	const hasAllPermissionsResult = hasAllPermissions ? hasPermission(hasAllPermissions) : true;
	const hasOnePermissionResult = hasOnePermission ? hasAtLeastOnePermission(hasOnePermission) : true;
	const hasAllRolesResult = hasAllRoles ? hasAllRoles.every((role) => hasRole(Meteor.userId(), role, room?._id)) : true;
	const hasOneRoleResult = hasOneRole ? hasRole(Meteor.userId(), hasOneRole, room?._id) : true;

	return hasAllPermissionsResult && hasOnePermissionResult && hasAllRolesResult && hasOneRoleResult;
};

const enumToFilter: {[k in TemporaryRoomTypeFilter]: (room: IRoom) => boolean} = {
	[TemporaryRoomTypeFilter.PUBLIC_CHANNEL]: (room) => room.t === 'c',
	[TemporaryRoomTypeFilter.PRIVATE_CHANNEL]: (room) => room.t === 'p',
	[TemporaryRoomTypeFilter.PUBLIC_TEAM]: isPublicTeamRoom,
	[TemporaryRoomTypeFilter.PRIVATE_TEAM]: isPrivateTeamRoom,
	[TemporaryRoomTypeFilter.PUBLIC_DISCUSSION]: isPublicDiscussion,
	[TemporaryRoomTypeFilter.PRIVATE_DISCUSSION]: isPrivateDiscussion,
	[TemporaryRoomTypeFilter.DIRECT]: isDirectMessageRoom,
	[TemporaryRoomTypeFilter.DIRECT_MULTIPLE]: isMultipleDirectMessageRoom,
	[TemporaryRoomTypeFilter.LIVE_CHAT]: isOmnichannelRoom,
};

export const applyRoomFilter = (button: IUIActionButton, room: IRoom): boolean => {
	const { roomTypes } = button.when || {};
	return !roomTypes || roomTypes.some((filter): boolean => enumToFilter[filter]?.(room));
};

export const applyButtonFilters = (button: IUIActionButton, room?: IRoom): boolean => {
	return applyAuthFilter(button, room) && (!room || applyRoomFilter(button, room));
};
