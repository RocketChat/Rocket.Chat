import { registerModel } from '@rocket.chat/models';
import type { IUsersModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/Users';
import { UsersRaw } from './raw/Users';

const col = MeteorModel.model.rawCollection();
export const Users = new UsersRaw(col, trashCollection);
registerModel('IUsersModel', Users as IUsersModel);
