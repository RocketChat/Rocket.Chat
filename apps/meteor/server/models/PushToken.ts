import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { PushTokenRaw } from './raw/PushToken';

registerModel('IPushTokenModel', new PushTokenRaw(db));
