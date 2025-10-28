import { proxify } from '@rocket.chat/core-services';

import type { IInstanceService } from './types/IInstanceService';
import type { ILDAPEEService } from './types/ILDAPEEService';

export const LDAPEE = proxify<ILDAPEEService>('ldap-enterprise');
export const Instance = proxify<IInstanceService>('instance');
