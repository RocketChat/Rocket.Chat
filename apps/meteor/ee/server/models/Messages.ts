import { registerModel } from '@rocket.chat/models';

import { MessagesEE } from './raw/Messages';
import { db } from '../../../server/database/utils';
import { trashCollection } from '../../../server/database/trash';

registerModel('IMessagesModel', new MessagesEE(db, trashCollection));
