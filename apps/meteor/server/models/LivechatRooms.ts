import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { LivechatRoomsRaw } from './raw/LivechatRooms';

registerModel('ILivechatRoomsModel', new LivechatRoomsRaw(trashCollection));
