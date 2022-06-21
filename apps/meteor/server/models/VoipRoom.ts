import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { VoipRoomRaw } from './raw/VoipRoom';

const col = db.collection(`${prefix}room`);
registerModel('IVoipRoomModel', new VoipRoomRaw(col, trashCollection));
