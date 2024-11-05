import { registerModel } from '@rocket.chat/models';

import { LivechatPriorityRaw } from './raw/LivechatPriority';
import { db } from '../../../server/database/utils';

registerModel('ILivechatPriorityModel', new LivechatPriorityRaw(db));
