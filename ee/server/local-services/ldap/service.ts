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
}

api.registerService(new LDAPEEService());
