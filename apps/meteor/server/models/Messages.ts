import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { MessagesRaw } from './raw/Messages';

registerModel('IMessagesModel', new MessagesRaw(trashCollection));
