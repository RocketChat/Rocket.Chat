import { registerModel } from '@rocket.chat/models';
import type { IServerEventsModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { ServerEventsRaw } from './raw/ServerEvents';

const col = db.collection(`${prefix}server_events`);
registerModel('IServerEventsModel', new ServerEventsRaw(col, trashCollection) as IServerEventsModel);
