import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../../../server/database/trash';
import { LivechatRoomsRawEE } from './raw/LivechatRooms';

registerModel('ILivechatRoomsModel', new LivechatRoomsRawEE(trashCollection));
