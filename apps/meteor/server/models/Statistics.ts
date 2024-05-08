import { registerModel } from '@rocket.chat/models';

import { StatisticsRaw } from './raw/Statistics';

registerModel('IStatisticsModel', new StatisticsRaw());
