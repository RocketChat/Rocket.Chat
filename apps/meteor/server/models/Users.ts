import { registerModel } from '@rocket.chat/models';

import { UsersRaw } from './raw/Users';

registerModel('IUsersModel', new UsersRaw());
