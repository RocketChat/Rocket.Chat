import { registerModel } from '@rocket.chat/models';

import { PushTokenRaw } from './raw/PushToken';

registerModel('IPushTokenModel', new PushTokenRaw());
