import { registerModel } from '@rocket.chat/models';

import { LivechatTriggerRaw } from './raw/LivechatTrigger';

registerModel('ILivechatTriggerModel', new LivechatTriggerRaw());
