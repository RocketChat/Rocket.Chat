import { registerModel } from '@rocket.chat/models';

import { MessagesEE } from './raw/Messages';
import { db } from '../../../server/database/utils';

registerModel('IMessagesModel', new MessagesEE(db));
