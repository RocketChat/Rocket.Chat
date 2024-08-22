import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { MessagesRaw } from './raw/Messages';

registerModel('IMessagesModel', new MessagesRaw(db, trashCollection));
