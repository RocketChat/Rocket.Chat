import { proxifyWithWait } from '@rocket.chat/core-services';

import type { ILDAPEEService } from './types/ILDAPEEService';

export const LDAPEE = proxifyWithWait<ILDAPEEService>('ldap-enterprise');
