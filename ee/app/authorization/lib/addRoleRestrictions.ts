import { guestPermissions } from './guestPermissions';
import { IAuthorization } from '../../../../app/authorization/lib/IAuthorizationUtils';

export const addRoleRestrictions = function(AuthorizationUtils: IAuthorization): void {
	AuthorizationUtils.addRolePermissionWhiteList('guest', guestPermissions);
};
