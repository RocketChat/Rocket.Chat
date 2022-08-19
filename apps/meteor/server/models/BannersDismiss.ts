import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { BannersDismissRaw } from './raw/BannersDismiss';

registerModel('IBannersDismissModel', new BannersDismissRaw(db));
