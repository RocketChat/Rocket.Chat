import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../../../server/database/trash';
import { LivechatDepartmentEE } from './raw/LivechatDepartment';

registerModel('ILivechatDepartmentModel', new LivechatDepartmentEE(trashCollection));
