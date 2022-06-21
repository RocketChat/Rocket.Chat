import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { BannersDismissRaw } from './raw/BannersDismiss';

const col = db.collection(`${prefix}banner_dismiss`);
registerModel('IBannersDismissModel', new BannersDismissRaw(col, trashCollection));
