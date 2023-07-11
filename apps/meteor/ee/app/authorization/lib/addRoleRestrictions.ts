import { AuthorizationUtils } from '../../../../app/authorization/lib/AuthorizationUtils';
import { guestPermissions } from './guestPermissions';

export const addRoleRestrictions = () => {
	AuthorizationUtils.addRolePermissionWhiteList('guest', guestPermissions);
};
