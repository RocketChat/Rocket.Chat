import { registerModel } from '@rocket.chat/models';

import { CronHistoryRaw } from './raw/CronHistoryModel';

registerModel('ICronHistoryModel', new CronHistoryRaw());
