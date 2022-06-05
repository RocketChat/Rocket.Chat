import { registerModel } from '@rocket.chat/models';
import type { ILivechatRoomsModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/LivechatRooms';
import { LivechatRoomsRaw } from './raw/LivechatRooms';

const col = MeteorModel.model.rawCollection();
registerModel('ILivechatRoomsModel', new LivechatRoomsRaw(col, trashCollection) as ILivechatRoomsModel);
