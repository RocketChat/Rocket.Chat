import { registerModel } from '@rocket.chat/models';

import { BannersRaw } from './raw/Banners';

registerModel('IBannersModel', new BannersRaw());
