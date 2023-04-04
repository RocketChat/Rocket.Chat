import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { LivechatAgentActivityRaw } from './raw/LivechatAgentActivity';

registerModel('ILivechatAgentActivityModel', new LivechatAgentActivityRaw(db));
