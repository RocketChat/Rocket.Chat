import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { SmarshHistoryRaw } from './raw/SmarshHistory';

registerModel('ISmarshHistoryModel', new SmarshHistoryRaw(db));
