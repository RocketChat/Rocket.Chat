import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { ServerEventsRaw } from './raw/ServerEvents';

registerModel('IServerEventsModel', new ServerEventsRaw(db, trashCollection));
