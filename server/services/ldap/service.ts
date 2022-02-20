import { LDAPManager } from '../../lib/ldap/Manager';
import { ILDAPService } from '../../sdk/types/ILDAPService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { LDAPLoginResult } from '../../../definition/ldap/ILDAPLoginResult';

export class LDAPService extends ServiceClassInternal implements ILDAPService {
	protected name = 'ldap';

	async loginRequest(username: string, password: string): Promise<LDAPLoginResult> {
		return LDAPManager.login(username, password);
	}

	async testConnection(): Promise<void> {
		return LDAPManager.testConnection();
	}

	async testSearch(username: string): Promise<void> {
		return LDAPManager.testSearch(username);
	}
}
