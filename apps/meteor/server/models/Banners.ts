import { registerModel } from '@rocket.chat/models';
import type { IBannersModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { BannersRaw } from './raw/Banners';

const col = db.collection(`${prefix}banner`);
registerModel('IBannersModel', new BannersRaw(col, trashCollection) as IBannersModel);
