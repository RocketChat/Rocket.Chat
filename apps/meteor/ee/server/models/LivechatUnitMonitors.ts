import { registerModel } from '@rocket.chat/models';

import MeteorModel from '../../app/models/server/models/LivechatUnitMonitors';
import { LivechatUnitMonitorsRaw } from './raw/LivechatUnitMonitors';

const col = MeteorModel.model.rawCollection();
registerModel('ILivechatUnitMonitorsModel', new LivechatUnitMonitorsRaw(col));
