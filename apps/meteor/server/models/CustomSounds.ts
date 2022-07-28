import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { CustomSoundsRaw } from './raw/CustomSounds';

registerModel('ICustomSoundsModel', new CustomSoundsRaw(db, trashCollection));
