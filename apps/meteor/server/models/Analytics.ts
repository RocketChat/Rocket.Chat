import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { readSecondaryPreferred } from '../database/readSecondaryPreferred';
import { AnalyticsRaw } from './raw/Analytics';

const col = db.collection(`${prefix}analytics`, { readPreference: readSecondaryPreferred(db) });
export const Analytics = new AnalyticsRaw(col, trashCollection);
registerModel('IAnalyticsModel', Analytics);
