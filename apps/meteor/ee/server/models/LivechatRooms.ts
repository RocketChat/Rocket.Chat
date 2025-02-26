import { registerModel } from '@rocket.chat/models';

import { LivechatRoomsRawEE } from './raw/LivechatRooms';
import { trashCollection } from '../../../server/database/trash';
import { db } from '../../../server/database/utils';

registerModel('ILivechatRoomsModel', new LivechatRoomsRawEE(db, trashCollection));
