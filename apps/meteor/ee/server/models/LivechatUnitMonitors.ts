import { registerModel } from '@rocket.chat/models';

import { LivechatUnitMonitorsRaw } from './raw/LivechatUnitMonitors';

registerModel('ILivechatUnitMonitorsModel', new LivechatUnitMonitorsRaw());
