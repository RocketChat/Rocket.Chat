import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../../../server/database/trash';
import { db } from '../../../server/database/utils';
import { LivechatDepartmentEE } from './raw/LivechatDepartment';

registerModel('ILivechatDepartmentModel', new LivechatDepartmentEE(db, trashCollection));
