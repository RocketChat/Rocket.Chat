import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { FindCursor } from 'mongodb';

import { LDAPEEManager } from '../../lib/ldap/Manager';
import type { ILDAPEEService } from '../../sdk/types/ILDAPEEService';

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

	async syncAbacAttributes(): Promise<void> {
		return LDAPEEManager.syncAbacAttributes();
	}

	async syncUsersAbacAttributes(users: FindCursor<IUser>): Promise<void> {
		return LDAPEEManager.syncUsersAbacAttributes(users);
	}
}
