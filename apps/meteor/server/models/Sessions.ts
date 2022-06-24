import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { SessionsRaw } from './raw/Sessions';

registerModel('ISessionsModel', new SessionsRaw(db, trashCollection));
