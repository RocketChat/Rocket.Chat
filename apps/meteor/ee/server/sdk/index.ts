import type { ILDAPEEService } from './types/ILDAPEEService';
import { proxifyWithWait } from '../../../server/sdk/lib/proxify';
import type { IOmniJobSchedulerService } from './types/IOmniJobSchedularService';
import type { IOmniEEService } from './types/IOmniEEService';

export const LDAPEE = proxifyWithWait<ILDAPEEService>('ldap-enterprise');
export const OmniJobSchedulerService = proxifyWithWait<IOmniJobSchedulerService>('omni-job-scheduler');
export const OmniEEService = proxifyWithWait<IOmniEEService>('omni-ee-service');
