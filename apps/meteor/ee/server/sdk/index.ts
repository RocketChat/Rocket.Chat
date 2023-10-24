import { proxifyWithWait } from '@rocket.chat/core-services';

import type { IInstanceService } from './types/IInstanceService';
import type { ILDAPEEService } from './types/ILDAPEEService';

export const LDAPEE = proxifyWithWait<ILDAPEEService>('ldap-enterprise');
export const Instance = proxifyWithWait<IInstanceService>('instance');
