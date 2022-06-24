import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { ReportsRaw } from './raw/Reports';

registerModel('IReportsModel', new ReportsRaw(db, trashCollection));
