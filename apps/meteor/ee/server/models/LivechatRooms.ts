import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../../../server/database/trash';
import { db } from '../../../server/database/utils';
import { LivechatRoomsRawEE } from './raw/LivechatRooms';

registerModel('ILivechatRoomsModel', new LivechatRoomsRawEE(db, trashCollection));
