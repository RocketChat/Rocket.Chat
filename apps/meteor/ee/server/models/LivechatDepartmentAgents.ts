import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../../../server/database/trash';
import { db } from '../../../server/database/utils';
import { LivechatDepartmentAgents } from './raw/LivechatDepartmentAgents';

registerModel('ILivechatDepartmentAgents', new LivechatDepartmentAgents(db, trashCollection));
