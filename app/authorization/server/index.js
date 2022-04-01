import { canAccessRoom, canAccessRoomId, roomAccessAttributes, roomAccessValidators } from './functions/canAccessRoom';
import { canSendMessage, validateRoomMessagePermissions } from './functions/canSendMessage';
import { getRoles } from './functions/getRoles';
import { getUsersInRole } from './functions/getUsersInRole';
import { hasAllPermission, hasAtLeastOnePermission, hasPermission } from './functions/hasPermission';
import { hasRole, hasAnyRole, subscriptionHasRole } from './functions/hasRole';
import { AuthorizationUtils } from '../lib/AuthorizationUtils';
import './methods/addPermissionToRole';
import './methods/addUserToRole';
import './methods/deleteRole';
import './methods/removeRoleFromPermission';
import './methods/removeUserFromRole';
import './methods/saveRole';
import './streamer/permissions';

export {
	getRoles,
	getUsersInRole,
	hasRole,
	hasAnyRole,
	subscriptionHasRole,
	canSendMessage,
	validateRoomMessagePermissions,
	roomAccessValidators,
	canAccessRoom,
	canAccessRoomId,
	roomAccessAttributes,
	hasAllPermission,
	hasAtLeastOnePermission,
	hasPermission,
	AuthorizationUtils,
};
