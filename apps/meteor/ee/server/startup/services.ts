import { api } from '../../../server/sdk/api';
import { EnterpriseSettings } from '../../app/settings/server/settings.internalService';
import { LDAPEEService } from '../local-services/ldap/service';
import { LicenseService } from '../../app/license/server/license.internalService';
import { OmniEEService } from '../local-services/omnichannel/OmniEEService';
import { OmniJobSchedulerService } from '../local-services/omnichannel/OmniJobSchedulerService';

// TODO consider registering these services only after a valid license is added
api.registerService(new EnterpriseSettings());
api.registerService(new LDAPEEService());
api.registerService(new LicenseService());
api.registerService(new OmniJobSchedulerService());
api.registerService(new OmniEEService());
