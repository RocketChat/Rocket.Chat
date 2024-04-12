import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { LivechatDepartmentRaw } from './raw/LivechatDepartment';

registerModel('ILivechatDepartmentModel', new LivechatDepartmentRaw(trashCollection));
