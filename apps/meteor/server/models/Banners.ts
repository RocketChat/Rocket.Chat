import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { BannersRaw } from './raw/Banners';

const col = db.collection(`${prefix}banner`);
registerModel('IBannersModel', new BannersRaw(col, trashCollection));
