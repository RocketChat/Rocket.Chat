import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { CustomUserStatusRaw } from './raw/CustomUserStatus';

const col = db.collection(`${prefix}custom_user_status`);
registerModel('ICustomUserStatusModel', new CustomUserStatusRaw(col, trashCollection));
