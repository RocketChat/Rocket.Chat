import { LDAPEEManager } from '../../lib/ldap/Manager';
import type { ILDAPEEService } from '../../sdk/types/ILDAPEEService';
import { ServiceClassInternal } from '../../../../server/sdk/types/ServiceClass';

export class LDAPEEService extends ServiceClassInternal implements ILDAPEEService {
	protected name = 'ldap-enterprise';

	async sync(): Promise<void> {
		return LDAPEEManager.sync();
	}

	async syncAvatars(): Promise<void> {
		return LDAPEEManager.syncAvatars();
	}

	async syncLogout(): Promise<void> {
		return LDAPEEManager.syncLogout();
	}
}
