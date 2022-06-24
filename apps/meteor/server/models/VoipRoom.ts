import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { VoipRoomRaw } from './raw/VoipRoom';

registerModel('IVoipRoomModel', new VoipRoomRaw(db, trashCollection));
