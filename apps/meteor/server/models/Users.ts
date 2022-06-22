import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { UsersRaw } from './raw/Users';

registerModel('IUsersModel', new UsersRaw(db, trashCollection));
