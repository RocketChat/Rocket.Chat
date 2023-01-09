import { api } from '@rocket.chat/core-services';

import { EnterpriseSettings } from '../../app/settings/server/settings.internalService';
import { LDAPEEService } from '../local-services/ldap/service';
import { LicenseService } from '../../app/license/server/license.internalService';

// TODO consider registering these services only after a valid license is added
api.registerService(new EnterpriseSettings());
api.registerService(new LDAPEEService());
api.registerService(new LicenseService());
