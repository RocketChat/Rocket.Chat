import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/LivechatDepartmentAgents';
import { LivechatDepartmentAgentsRaw } from './raw/LivechatDepartmentAgents';

const col = MeteorModel.model.rawCollection();
export const LivechatDepartmentAgents = new LivechatDepartmentAgentsRaw(col, trashCollection);
registerModel('ILivechatDepartmentAgentsModel', LivechatDepartmentAgents);
