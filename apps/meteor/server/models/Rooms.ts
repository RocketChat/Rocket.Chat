import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/Rooms';
import { RoomsRaw } from './raw/Rooms';

const col = MeteorModel.model.rawCollection();
export const Rooms = new RoomsRaw(col, trashCollection);
registerModel('IRoomsModel', Rooms);
