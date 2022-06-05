import { registerModel } from '@rocket.chat/models';
import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { ILivechatUnitMonitorsModel } from '@rocket.chat/model-typings';

import { ModelClass } from '../../../server/models/ModelClass';
import MeteorModel from '../../app/models/server/models/LivechatUnitMonitors';

export class LivechatUnitMonitors extends ModelClass<IRocketChatRecord> implements ILivechatUnitMonitorsModel {}

const col = (MeteorModel as any).model.rawCollection();
registerModel('ILivechatUnitMonitorsModel', new LivechatUnitMonitors(col) as ILivechatUnitMonitorsModel);
