import { registerModel } from '@rocket.chat/models';

import { UsersSessionsRaw } from './raw/UsersSessions';

registerModel('IUsersSessionsModel', new UsersSessionsRaw());
