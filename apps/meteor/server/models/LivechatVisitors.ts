import { registerModel } from '@rocket.chat/models';

import { LivechatVisitorsRaw } from './raw/LivechatVisitors';

registerModel('ILivechatVisitorsModel', new LivechatVisitorsRaw());
