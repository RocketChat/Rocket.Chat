import { ILDAPEEService } from './types/ILDAPEEService';
import { proxifyWithWait } from '../../../server/sdk/lib/proxify';

export const LDAPEE = proxifyWithWait<ILDAPEEService>('ldap-enterprise');
