import { registerModel } from '@rocket.chat/models';

import { LivechatDepartmentEE } from './raw/LivechatDepartment';
import { trashCollection } from '../../../server/database/trash';
import { db } from '../../../server/database/utils';

registerModel('ILivechatDepartmentModel', new LivechatDepartmentEE(db, trashCollection));
