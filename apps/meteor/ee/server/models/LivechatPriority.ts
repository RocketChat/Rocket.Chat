import { registerModel } from '@rocket.chat/models';

import { LivechatPriorityRaw } from './raw/LivechatPriority';

registerModel('ILivechatPriorityModel', new LivechatPriorityRaw());
