import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { ReportsRaw } from './raw/Reports';

const col = db.collection(`${prefix}reports`);
registerModel('IReportsModel', new ReportsRaw(col, trashCollection));
