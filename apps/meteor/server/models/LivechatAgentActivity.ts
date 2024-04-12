import { registerModel } from '@rocket.chat/models';

import { LivechatAgentActivityRaw } from './raw/LivechatAgentActivity';

registerModel('ILivechatAgentActivityModel', new LivechatAgentActivityRaw());
