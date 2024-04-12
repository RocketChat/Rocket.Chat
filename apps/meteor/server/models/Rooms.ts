import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { RoomsRaw } from './raw/Rooms';

registerModel('IRoomsModel', new RoomsRaw(trashCollection));
