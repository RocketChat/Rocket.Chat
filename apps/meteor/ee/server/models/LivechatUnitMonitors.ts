import { registerModel } from '@rocket.chat/models';

import { LivechatUnitMonitorsRaw } from './raw/LivechatUnitMonitors';
import { db } from '../../../server/database/utils';

registerModel('ILivechatUnitMonitorsModel', new LivechatUnitMonitorsRaw(db));
