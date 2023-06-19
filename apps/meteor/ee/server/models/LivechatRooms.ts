import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { LivechatRoomsRawEE } from './raw/LivechatRooms';
import { trashCollection } from '../../../server/database/trash';

registerModel('ILivechatRoomsModel', new LivechatRoomsRawEE(db, trashCollection));
