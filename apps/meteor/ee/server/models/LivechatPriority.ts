import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { LivechatPriorityRaw } from './raw/LivechatPriority';

registerModel('ILivechatPriorityModel', new LivechatPriorityRaw(db));
