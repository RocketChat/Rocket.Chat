import { AbstractAuthorizationUtils, IAuthorization } from '../lib/IAuthorizationUtils';
import { hasAtLeastOnePermission } from './functions/hasPermission';

import { hasPermission } from '.';

class AuthorizationUtilsClass extends AbstractAuthorizationUtils implements IAuthorization {
	hasPermission(userId: string, permissionId: string, scope?: string): boolean {
		return hasPermission(userId, permissionId, scope);
	}

	hasAtLeastOnePermission(userId: string, permissions: string[], scope?: string): boolean {
		return hasAtLeastOnePermission(userId, permissions, scope);
	}
}

export const AuthorizationUtils = new AuthorizationUtilsClass();
