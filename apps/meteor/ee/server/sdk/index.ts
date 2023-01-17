import { proxifyWithWait } from '@rocket.chat/core-services';

import type { ILDAPEEService, IReadsService } from './types';

export const LDAPEE = proxifyWithWait<ILDAPEEService>('ldap-enterprise');
export const Reads = proxifyWithWait<IReadsService>('reads');
