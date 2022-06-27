import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { BannersDismissRaw } from './raw/BannersDismiss';

registerModel('IBannersDismissModel', new BannersDismissRaw(db, trashCollection));
