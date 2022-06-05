import { registerModel } from '@rocket.chat/models';
import type { IMessagesModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/Messages';
import { MessagesRaw } from './raw/Messages';

const col = MeteorModel.model.rawCollection();
export const Messages = new MessagesRaw(col, trashCollection);
registerModel('IMessagesModel', Messages as IMessagesModel);
