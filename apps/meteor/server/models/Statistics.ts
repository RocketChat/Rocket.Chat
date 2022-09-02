import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { StatisticsRaw } from './raw/Statistics';

registerModel('IStatisticsModel', new StatisticsRaw(db));
