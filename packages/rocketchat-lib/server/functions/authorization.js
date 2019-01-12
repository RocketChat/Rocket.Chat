import {
	addUserRoles,
	roomAccessValidators,
	canAccessRoom,
	addRoomAccessValidator,
	getRoles,
	getUsersInRole,
	hasAllPermission,
	hasPermission,
	hasAtLeastOnePermission,
	hasRole,
	removeUserFromRoles,
} from 'meteor/rocketchat:authorization';

RocketChat.authz.addUserRoles = addUserRoles;
RocketChat.authz.roomAccessValidators = roomAccessValidators;
RocketChat.authz.canAccessRoom = canAccessRoom;
RocketChat.authz.addRoomAccessValidator = addRoomAccessValidator;
RocketChat.authz.getRoles = getRoles;
RocketChat.authz.getUsersInRole = getUsersInRole;
RocketChat.authz.hasAllPermission = hasAllPermission;
RocketChat.authz.hasPermission = hasPermission;
RocketChat.authz.hasAtLeastOnePermission = hasAtLeastOnePermission;
RocketChat.authz.hasRole = hasRole;
RocketChat.authz.removeUserFromRoles = removeUserFromRoles;
