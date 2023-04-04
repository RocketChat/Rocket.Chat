import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { LivechatTriggerRaw } from './raw/LivechatTrigger';

registerModel('ILivechatTriggerModel', new LivechatTriggerRaw(db));
