import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { StatisticsRaw } from './raw/Statistics';

const col = db.collection(`${prefix}statistics`);
registerModel('IStatisticsModel', new StatisticsRaw(col, trashCollection));
