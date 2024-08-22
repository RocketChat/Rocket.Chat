import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { CustomUserStatusRaw } from './raw/CustomUserStatus';

registerModel('ICustomUserStatusModel', new CustomUserStatusRaw(db));
