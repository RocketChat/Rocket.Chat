import { registerModel } from '@rocket.chat/models';

import { SessionsRaw } from './raw/Sessions';

registerModel('ISessionsModel', new SessionsRaw());
