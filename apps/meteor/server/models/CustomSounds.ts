import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { CustomSoundsRaw } from './raw/CustomSounds';

registerModel('ICustomSoundsModel', new CustomSoundsRaw(db));
