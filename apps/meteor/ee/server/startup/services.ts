import { MongoInternals } from 'meteor/mongo';

import { api } from '../../../server/sdk/api';
import { EnterpriseSettings } from '../../app/settings/server/settings.internalService';
import { LDAPEEService } from '../local-services/ldap/service';
import { LicenseService } from '../../app/license/server/license.internalService';
import { OmniEEService } from '../local-services/omnichannel/OmniEEService';
import { OmniJobSchedulerService } from '../local-services/omnichannel/OmniJobSchedulerService';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

// TODO consider registering these services only after a valid license is added
api.registerService(new EnterpriseSettings());
api.registerService(new LDAPEEService());
api.registerService(new LicenseService());
api.registerService(new OmniEEService());
api.registerService(new OmniJobSchedulerService(db));
