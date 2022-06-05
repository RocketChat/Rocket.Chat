import { registerModel } from '@rocket.chat/models';
import type { IAvatarsModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { AvatarsRaw } from './raw/Avatars';

const col = db.collection(`${prefix}avatars`);
export const Avatars = new AvatarsRaw(col, trashCollection) as IAvatarsModel;
registerModel('IAvatarsModel', Avatars);
