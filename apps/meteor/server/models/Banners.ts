import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { BannersRaw } from './raw/Banners';

registerModel('IBannersModel', new BannersRaw(db));
