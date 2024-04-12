import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../../../server/database/trash';
import { LivechatDepartmentAgents } from './raw/LivechatDepartmentAgents';

registerModel('ILivechatDepartmentAgentsModel', new LivechatDepartmentAgents(trashCollection));
