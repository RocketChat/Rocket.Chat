import type { ILDAPEEService } from './types/ILDAPEEService';
import { proxifyWithWait } from '../../../server/sdk/lib/proxify';
import type { IOmniJobSchedularService } from './types/IOmniJobSchedularService';
import type { IOmniEEService } from './types/IOmniEEService';

export const LDAPEE = proxifyWithWait<ILDAPEEService>('ldap-enterprise');
export const OmniJobSchedularService = proxifyWithWait<IOmniJobSchedularService>('omni-job-schedular');
export const OmniEEService = proxifyWithWait<IOmniEEService>('omni-ee-service');
