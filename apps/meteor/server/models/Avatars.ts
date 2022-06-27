import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { AvatarsRaw } from './raw/Avatars';

registerModel('IAvatarsModel', new AvatarsRaw(db, trashCollection));
