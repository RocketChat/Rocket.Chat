import { registerModel } from '@rocket.chat/models';

import { IntegrationHistoryRaw } from './raw/IntegrationHistory';

registerModel('IIntegrationHistoryModel', new IntegrationHistoryRaw());
