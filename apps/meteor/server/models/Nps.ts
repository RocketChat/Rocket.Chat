import { registerModel } from '@rocket.chat/models';
import type { INpsModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { NpsRaw } from './raw/Nps';

const col = db.collection(`${prefix}nps`);
registerModel('INpsModel', new NpsRaw(col, trashCollection) as INpsModel);
