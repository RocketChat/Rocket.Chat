/* Style disabled as having some arrow functions in one-line hurts readability */
/* eslint-disable arrow-body-style */

import { Meteor } from 'meteor/meteor';
import { IUIActionButton, TemporaryRoomTypeFilter } from '@rocket.chat/apps-engine/definition/ui';

import { hasAtLeastOnePermission, hasPermission, hasRole } from '../../../../authorization/client';
import { IRoom, RoomType } from '../../../../../definition/IRoom';

export const applyAuthFilter = (button: IUIActionButton): boolean => {
	const { hasAllPermissions, hasOnePermission, hasAllRoles, hasOneRole } = button.when || {};

	const hasAllPermissionsResult = hasAllPermissions ? hasPermission(hasAllPermissions) : true;
	const hasOnePermissionResult = hasOnePermission ? hasAtLeastOnePermission(hasOnePermission) : true;
	const hasAllRolesResult = hasAllRoles ? hasAllRoles.every((role) => hasRole(Meteor.userId(), role)) : true;
	const hasOneRoleResult = hasOneRole ? hasRole(Meteor.userId(), hasOneRole) : true;

	return hasAllPermissionsResult && hasOnePermissionResult && hasAllRolesResult && hasOneRoleResult;
};

const mapFilterToRoomType: {[k in TemporaryRoomTypeFilter]: RoomType} = {
	[TemporaryRoomTypeFilter.CHANNEL]: 'c',
	[TemporaryRoomTypeFilter.GROUP]: 'p',
	[TemporaryRoomTypeFilter.DIRECT]: 'd',
	[TemporaryRoomTypeFilter.DIRECT_MULTIPLE]: 'd',
	[TemporaryRoomTypeFilter.TEAM]: 'p',
	[TemporaryRoomTypeFilter.LIVE_CHAT]: 'l',
};

export const applyRoomFilter = (button: IUIActionButton, room: IRoom): boolean => {
	const { roomTypes } = button.when || {};
	return !roomTypes || roomTypes.some((filter): boolean => mapFilterToRoomType[filter] === room.t);
};

export const applyButtonFilters = (button: IUIActionButton, room?: IRoom): boolean => {
	return applyAuthFilter(button) && (!room || applyRoomFilter(button, room));
};
