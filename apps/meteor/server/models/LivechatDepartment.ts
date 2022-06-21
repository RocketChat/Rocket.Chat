import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/LivechatDepartment';
import { LivechatDepartmentRaw } from './raw/LivechatDepartment';

const col = MeteorModel.model.rawCollection();
registerModel('ILivechatDepartmentModel', new LivechatDepartmentRaw(col, trashCollection));
