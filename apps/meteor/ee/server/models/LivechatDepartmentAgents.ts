import { registerModel } from '@rocket.chat/models';

import { LivechatDepartmentAgents } from './raw/LivechatDepartmentAgents';
import { trashCollection } from '../../../server/database/trash';
import { db } from '../../../server/database/utils';

registerModel('ILivechatDepartmentAgentsModel', new LivechatDepartmentAgents(db, trashCollection));
