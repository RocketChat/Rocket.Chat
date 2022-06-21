import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { VoipRoomsRaw } from './raw/VoipRooms';

const col = db.collection(`${prefix}room`);
registerModel('IVoipRoomsModel', new VoipRoomsRaw(col, trashCollection));
