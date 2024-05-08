import { registerModel } from '@rocket.chat/models';

import { NpsRaw } from './raw/Nps';

registerModel('INpsModel', new NpsRaw());
