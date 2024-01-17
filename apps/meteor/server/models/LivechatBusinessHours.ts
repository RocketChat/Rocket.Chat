import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { LivechatBusinessHoursRaw } from './raw/LivechatBusinessHours';

registerModel('ILivechatBusinessHoursModel', new LivechatBusinessHoursRaw(db));
