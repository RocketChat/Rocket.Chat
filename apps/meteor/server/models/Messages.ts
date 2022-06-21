import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/Messages';
import { MessagesRaw } from './raw/Messages';

const col = MeteorModel.model.rawCollection();
export const Messages = new MessagesRaw(col, trashCollection);
registerModel('IMessagesModel', Messages);
