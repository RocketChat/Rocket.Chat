import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { NpsRaw } from './raw/Nps';

const col = db.collection(`${prefix}nps`);
registerModel('INpsModel', new NpsRaw(col, trashCollection));
