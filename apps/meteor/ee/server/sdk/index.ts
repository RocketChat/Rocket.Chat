import { proxifyWithWait } from '@rocket.chat/core-services';

import type { ILDAPEEService } from './types/ILDAPEEService';
import type { IInstanceService } from './types/IInstanceService';

export const LDAPEE = proxifyWithWait<ILDAPEEService>('ldap-enterprise');
export const Instance = proxifyWithWait<IInstanceService>('instance');
