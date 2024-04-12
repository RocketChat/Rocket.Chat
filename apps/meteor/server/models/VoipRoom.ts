import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { VoipRoomRaw } from './raw/VoipRoom';

registerModel('IVoipRoomModel', new VoipRoomRaw(trashCollection));
