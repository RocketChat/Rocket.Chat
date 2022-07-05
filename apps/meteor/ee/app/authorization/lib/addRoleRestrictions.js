import { AuthorizationUtils } from '../../../../app/authorization/lib/AuthorizationUtils';
import { guestPermissions } from './guestPermissions';

export const addRoleRestrictions = function () {
	AuthorizationUtils.addRolePermissionWhiteList('guest', guestPermissions);
};
