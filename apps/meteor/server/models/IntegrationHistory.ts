import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { IntegrationHistoryRaw } from './raw/IntegrationHistory';

const col = db.collection(`${prefix}integration_history`);
export const IntegrationHistory = new IntegrationHistoryRaw(col, trashCollection);
registerModel('IIntegrationHistoryModel', IntegrationHistory);
