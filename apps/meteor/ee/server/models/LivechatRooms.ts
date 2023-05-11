import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { LivechatRoomsRawEE } from './raw/LivechatRooms';
import { trashCollection } from '../../../server/database/trash';

// @ts-expect-error - find is async on EE
registerModel('ILivechatRoomsModel', new LivechatRoomsRawEE(db, trashCollection));
