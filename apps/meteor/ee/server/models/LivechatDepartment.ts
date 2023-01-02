import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { LivechatDepartmentEE } from './raw/LivechatDepartment';

registerModel('ILivechatDepartmentModel', new LivechatDepartmentEE(db));
