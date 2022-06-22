import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { UsersSessionsRaw } from './raw/UsersSessions';

registerModel('IUsersSessionsModel', new UsersSessionsRaw(db, trashCollection));
