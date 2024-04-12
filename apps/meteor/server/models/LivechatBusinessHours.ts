import { registerModel } from '@rocket.chat/models';

import { LivechatBusinessHoursRaw } from './raw/LivechatBusinessHours';

registerModel('ILivechatBusinessHoursModel', new LivechatBusinessHoursRaw());
