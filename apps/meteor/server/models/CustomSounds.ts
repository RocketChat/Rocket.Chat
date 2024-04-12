import { registerModel } from '@rocket.chat/models';

import { CustomSoundsRaw } from './raw/CustomSounds';

registerModel('ICustomSoundsModel', new CustomSoundsRaw());
