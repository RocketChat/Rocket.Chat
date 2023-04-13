import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { trashCollection } from '../../../server/database/trash';
import { LivechatDepartmentAgents } from './raw/LivechatDepartmentAgents';

registerModel('ILivechatDepartmentAgents', new LivechatDepartmentAgents(db, trashCollection));
