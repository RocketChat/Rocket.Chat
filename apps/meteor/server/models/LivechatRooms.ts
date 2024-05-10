import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { LivechatRoomsRaw } from './raw/LivechatRooms';

registerModel('ILivechatRoomsModel', new LivechatRoomsRaw(db, trashCollection));
