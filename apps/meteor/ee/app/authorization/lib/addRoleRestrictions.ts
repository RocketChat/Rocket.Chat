import { guestPermissions } from './guestPermissions';
import { AuthorizationUtils } from '../../../../app/authorization/lib/AuthorizationUtils';

export const addRoleRestrictions = function () {
	AuthorizationUtils.addRolePermissionWhiteList('guest', guestPermissions);
};
