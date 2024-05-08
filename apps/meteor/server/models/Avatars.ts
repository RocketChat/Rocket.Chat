import { registerModel } from '@rocket.chat/models';

import { AvatarsRaw } from './raw/Avatars';

registerModel('IAvatarsModel', new AvatarsRaw());
