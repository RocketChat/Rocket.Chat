import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { SmarshHistoryRaw } from './raw/SmarshHistory';

registerModel('ISmarshHistoryModel', new SmarshHistoryRaw(db, trashCollection));
