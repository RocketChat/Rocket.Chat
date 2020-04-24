import { AuthorizationUtils } from '../../lib/AuthorizationUtils';
import { clearCache } from '../functions/hasPermission';

const { addRolePermissionWhiteList: oldAddRolePermissionWhiteList } = AuthorizationUtils;

// Extends the method to also clear the server permission cache when a new role restriction is added
AuthorizationUtils.addRolePermissionWhiteList = function(...args) {
	oldAddRolePermissionWhiteList.call(this, ...args);
	clearCache();
};
