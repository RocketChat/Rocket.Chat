import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { UsersEE } from './raw/Users';

registerModel('IUsersModel', new UsersEE(db));
