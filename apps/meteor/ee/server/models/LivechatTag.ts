import { registerModel } from '@rocket.chat/models';

import { LivechatTagRaw } from './raw/LivechatTag';

registerModel('ILivechatTagModel', new LivechatTagRaw());
