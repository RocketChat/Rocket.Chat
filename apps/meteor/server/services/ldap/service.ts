import type { LDAPLoginResult } from '@rocket.chat/core-typings';
import type { ILDAPService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';

import { LDAPManager } from '../../lib/ldap/Manager';

export class LDAPService extends ServiceClassInternal implements ILDAPService {
	protected name = 'ldap';

	async loginRequest(username: string, password?: string): Promise<LDAPLoginResult> {
		return password ? LDAPManager.login(username, password) : LDAPManager.loginAuthenticatedUser(username);
	}

	async testConnection(): Promise<void> {
		return LDAPManager.testConnection();
	}

	async testSearch(username: string): Promise<void> {
		return LDAPManager.testSearch(username);
	}
}
