import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { ServerEventsRaw } from './raw/ServerEvents';

registerModel('IServerEventsModel', new ServerEventsRaw(db));
