import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { LivechatDepartmentAgentsRaw } from './raw/LivechatDepartmentAgents';

registerModel('ILivechatDepartmentAgentsModel', new LivechatDepartmentAgentsRaw(db, trashCollection));
