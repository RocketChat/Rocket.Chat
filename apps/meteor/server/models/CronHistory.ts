import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { CronHistoryRaw } from './raw/CronHistoryModel';

registerModel('ICronHistoryModel', new CronHistoryRaw(db));
