import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/LivechatBusinessHours';
import { LivechatBusinessHoursRaw } from './raw/LivechatBusinessHours';

const col = MeteorModel.model.rawCollection();
registerModel('ILivechatBusinessHoursModel', new LivechatBusinessHoursRaw(col, trashCollection));
