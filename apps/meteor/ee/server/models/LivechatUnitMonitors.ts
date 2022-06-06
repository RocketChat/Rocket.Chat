import { registerModel } from '@rocket.chat/models';
import type { ILivechatUnitMonitorsModel } from '@rocket.chat/model-typings';

import MeteorModel from '../../app/models/server/models/LivechatUnitMonitors';
import { LivechatUnitMonitorsRaw } from './raw/LivechatUnitMonitors';

const col = (MeteorModel as any).model.rawCollection();
registerModel('ILivechatUnitMonitorsModel', new LivechatUnitMonitorsRaw(col) as ILivechatUnitMonitorsModel);
