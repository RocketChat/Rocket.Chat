import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { UsersRaw } from './raw/Users';

registerModel('IUsersModel', new UsersRaw(db));
