import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { SmarshHistoryRaw } from './raw/SmarshHistory';

const col = db.collection(`${prefix}smarsh_history`);
registerModel('ISmarshHistoryModel', new SmarshHistoryRaw(col, trashCollection));
