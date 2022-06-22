import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { LivechatUnitMonitorsRaw } from './raw/LivechatUnitMonitors';

registerModel('ILivechatUnitMonitorsModel', new LivechatUnitMonitorsRaw(db));
