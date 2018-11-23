import { applyMeteorMixin } from '../../utils';

import hasPermissions from './hasPermissions';
import canAccessRoom from './canAccessRoom';

import addPermissionToRole from './addPermissionToRole';
import addUserToRole from './addUserToRole';
import deleteRole from './deleteRole';

import removeRoleFromPermission from './removeRoleFromPermission';
import removeUserFromRole from './removeUserFromRole';
import saveRole from './saveRole';

export default {
	version: 1,
	settings: {
		$noVersionPrefix: true,
	},
	name: 'authorization',
	mixins: [applyMeteorMixin()], // TODO remove
	actions: {
		...hasPermissions,
		...canAccessRoom,
		...addPermissionToRole,
		...addUserToRole,
		...deleteRole,
		...removeRoleFromPermission,
		...removeUserFromRole,
		...saveRole,
	},
};
