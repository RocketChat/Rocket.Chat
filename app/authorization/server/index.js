import { addUserRoles } from './functions/addUserRoles';
import {
	addRoomAccessValidator,
	canAccessRoom as canAccessRoomProm,
	roomAccessValidators,
} from './functions/canAccessRoom';
import { canSendMessage } from './functions/canSendMessage';
import { getRoles } from './functions/getRoles';
import { getUsersInRole } from './functions/getUsersInRole';
import {
	hasAllPermission as hasAllPermissionProm,
	hasAtLeastOnePermission as hasAtLeastOnePermissionProm,
	hasPermission as hasPermissionProm,
} from './functions/hasPermission';
import { hasRole } from './functions/hasRole';
import { removeUserFromRoles } from './functions/removeUserFromRoles';
import './methods/addPermissionToRole';
import './methods/addUserToRole';
import './methods/deleteRole';
import './methods/removeRoleFromPermission';
import './methods/removeUserFromRole';
import './methods/saveRole';
import './publications/permissions';
import './publications/roles';
import './publications/usersInRole';
import './startup';

export const canAccessRoom = (...args) => Promise.await(canAccessRoomProm(...args));
export const hasAllPermission = (...args) => Promise.await(hasAllPermissionProm(...args));
export const hasAtLeastOnePermission = (...args) => Promise.await(hasAtLeastOnePermissionProm(...args));
export const hasPermission = (...args) => Promise.await(hasPermissionProm(...args));

export {
	getRoles,
	getUsersInRole,
	hasRole,
	removeUserFromRoles,
	canSendMessage,
	addRoomAccessValidator,
	roomAccessValidators,
	addUserRoles,
};
