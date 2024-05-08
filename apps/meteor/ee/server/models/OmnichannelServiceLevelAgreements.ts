import { registerModel } from '@rocket.chat/models';

import { ServiceLevelAgreements } from './raw/ServiceLevelAgreements';

registerModel('IOmnichannelServiceLevelAgreementsModel', new ServiceLevelAgreements());
