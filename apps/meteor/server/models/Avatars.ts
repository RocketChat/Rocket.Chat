import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { AvatarsRaw } from './raw/Avatars';

const col = db.collection(`${prefix}avatars`);
export const Avatars = new AvatarsRaw(col, trashCollection);
registerModel('IAvatarsModel', Avatars);
