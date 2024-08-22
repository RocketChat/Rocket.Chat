import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { AvatarsRaw } from './raw/Avatars';

registerModel('IAvatarsModel', new AvatarsRaw(db));
