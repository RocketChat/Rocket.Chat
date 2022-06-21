import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { UsersSessionsRaw } from './raw/UsersSessions';

const col = db.collection('usersSessions');
export const UsersSessions = new UsersSessionsRaw(col, trashCollection, { preventSetUpdatedAt: true });
registerModel('IUsersSessionsModel', UsersSessions);
