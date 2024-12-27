import { registerModel } from '@rocket.chat/models';

import { ServiceLevelAgreements } from './raw/ServiceLevelAgreements';
import { db } from '../../../server/database/utils';

registerModel('IOmnichannelServiceLevelAgreementsModel', new ServiceLevelAgreements(db));
