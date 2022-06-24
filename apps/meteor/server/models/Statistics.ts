import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { StatisticsRaw } from './raw/Statistics';

registerModel('IStatisticsModel', new StatisticsRaw(db, trashCollection));
