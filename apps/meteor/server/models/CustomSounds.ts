import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { CustomSoundsRaw } from './raw/CustomSounds';

const col = db.collection(`${prefix}custom_sounds`);
registerModel('ICustomSoundsModel', new CustomSoundsRaw(col, trashCollection));
