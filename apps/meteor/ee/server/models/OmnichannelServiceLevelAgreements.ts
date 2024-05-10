import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { ServiceLevelAgreements } from './raw/ServiceLevelAgreements';

registerModel('IOmnichannelServiceLevelAgreementsModel', new ServiceLevelAgreements(db));
