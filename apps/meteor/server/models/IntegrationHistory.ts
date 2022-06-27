import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { IntegrationHistoryRaw } from './raw/IntegrationHistory';

registerModel('IIntegrationHistoryModel', new IntegrationHistoryRaw(db));
