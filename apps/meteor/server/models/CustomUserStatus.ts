import { registerModel } from '@rocket.chat/models';

import { CustomUserStatusRaw } from './raw/CustomUserStatus';

registerModel('ICustomUserStatusModel', new CustomUserStatusRaw());
