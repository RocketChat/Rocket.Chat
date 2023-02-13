import { proxifyWithWait } from '@rocket.chat/core-services';

import type { ILDAPEEService } from './types/ILDAPEEService';
import type { IInstanceService } from './types/IInstanceService';
import type { IReadsService } from './types/IReadsService';

export const LDAPEE = proxifyWithWait<ILDAPEEService>('ldap-enterprise');
export const Instance = proxifyWithWait<IInstanceService>('instance');
export const Reads = proxifyWithWait<IReadsService>('reads');
