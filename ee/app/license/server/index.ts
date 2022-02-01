import './settings';
import './methods';
import './startup';
import { LicenseService } from './license.internalService';
import { api } from '../../../../server/sdk/api';

export { onLicense, overwriteClassOnLicense, isEnterprise, getMaxGuestUsers } from './license';

export { getStatistics } from './getStatistics';

api.registerService(new LicenseService());
