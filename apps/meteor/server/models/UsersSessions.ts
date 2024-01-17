import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { UsersSessionsRaw } from './raw/UsersSessions';

registerModel('IUsersSessionsModel', new UsersSessionsRaw(db));
