import '../../broker';

import { api } from '../../../../server/sdk/api';
import { LDAPEEManager } from '../../lib/ldap/Manager';
import { ILDAPEEService } from '../../sdk/types/ILDAPEEService';
import { ServiceClass } from '../../../../server/sdk/types/ServiceClass';

export class LDAPEEService extends ServiceClass implements ILDAPEEService {
	protected name = 'ldap-enterprise';

	async sync(): Promise<void> {
		return LDAPEEManager.sync();
	}

	async syncAvatars(): Promise<void> {
		return LDAPEEManager.syncAvatars();
	}
}

api.registerService(new LDAPEEService());
