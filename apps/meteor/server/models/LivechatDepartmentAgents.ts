import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { LivechatDepartmentAgentsRaw } from './raw/LivechatDepartmentAgents';

registerModel('ILivechatDepartmentAgentsModel', new LivechatDepartmentAgentsRaw(trashCollection));
