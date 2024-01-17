import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { RoomsRaw } from './raw/Rooms';

registerModel('IRoomsModel', new RoomsRaw(db, trashCollection));
