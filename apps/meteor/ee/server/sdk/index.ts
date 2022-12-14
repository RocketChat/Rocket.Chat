import { proxifyWithWait } from '@rocket.chat/core-sdk';

import type { ILDAPEEService } from './types/ILDAPEEService';

export const LDAPEE = proxifyWithWait<ILDAPEEService>('ldap-enterprise');
