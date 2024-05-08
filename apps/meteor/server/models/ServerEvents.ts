import { registerModel } from '@rocket.chat/models';

import { ServerEventsRaw } from './raw/ServerEvents';

registerModel('IServerEventsModel', new ServerEventsRaw());
