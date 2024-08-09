import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { LivechatContactsRaw } from './raw/LivechatContacts';

registerModel('ILivechatContactsModel', new LivechatContactsRaw(db));
