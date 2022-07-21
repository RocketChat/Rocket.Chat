import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { LivechatDepartmentRaw } from './raw/LivechatDepartment';

registerModel('ILivechatDepartmentModel', new LivechatDepartmentRaw(db, trashCollection));
