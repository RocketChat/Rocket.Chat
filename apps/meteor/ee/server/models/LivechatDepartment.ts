import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { LivechatDepartmentEE } from './raw/LivechatDepartment';
import { trashCollection } from '../../../server/database/trash';

registerModel('ILivechatDepartmentModel', new LivechatDepartmentEE(db, trashCollection));
