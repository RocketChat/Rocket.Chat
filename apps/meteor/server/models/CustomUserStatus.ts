import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { CustomUserStatusRaw } from './raw/CustomUserStatus';

registerModel('ICustomUserStatusModel', new CustomUserStatusRaw(db, trashCollection));
