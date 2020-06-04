import { AbstractAuthorizationUtils, IAuthorization } from '../lib/IAuthorizationUtils';
import { hasAtLeastOnePermission, hasPermission } from './hasPermission';

class AuthorizationUtilsClass extends AbstractAuthorizationUtils implements IAuthorization {
	hasPermission(userId: string, permissionId: string, scope?: string): boolean {
		return hasPermission(permissionId, scope);
	}

	hasAtLeastOnePermission(userId: string, permissions: string[], scope?: string): boolean {
		return hasAtLeastOnePermission(permissions, scope);
	}
}

export const AuthorizationUtils = new AuthorizationUtilsClass();
