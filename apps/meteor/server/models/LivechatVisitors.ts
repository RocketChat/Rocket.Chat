import { registerModel } from '@rocket.chat/models';
import type { ILivechatVisitorsModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/LivechatVisitors';
import { LivechatVisitorsRaw } from './raw/LivechatVisitors';

const col = MeteorModel.model.rawCollection();
registerModel('ILivechatVisitorsModel', new LivechatVisitorsRaw(col, trashCollection) as ILivechatVisitorsModel);
