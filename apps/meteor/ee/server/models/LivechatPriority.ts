import { registerModel } from '@rocket.chat/models';
import type { ILivechatPriorityModel } from '@rocket.chat/model-typings';

import MeteorModel from '../../app/models/server/models/LivechatPriority';
import { LivechatPriorityRaw } from './raw/LivechatPriority';

const col = MeteorModel.model.rawCollection();
registerModel('ILivechatPriorityModel', new LivechatPriorityRaw(col) as ILivechatPriorityModel);
