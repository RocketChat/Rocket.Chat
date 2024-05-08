import { registerModel } from '@rocket.chat/models';

import { BannersDismissRaw } from './raw/BannersDismiss';

registerModel('IBannersDismissModel', new BannersDismissRaw());
