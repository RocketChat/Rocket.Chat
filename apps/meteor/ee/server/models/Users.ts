import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../../../server/database/trash';
import { UsersEE } from './raw/Users';

registerModel('IUsersModel', new UsersEE(trashCollection));
