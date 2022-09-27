import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { LivechatRoomsRawEE } from './raw/LivechatRooms';

registerModel('ILivechatRoomsModel', new LivechatRoomsRawEE(db));
