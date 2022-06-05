import { registerModel } from '@rocket.chat/models';
import type { IRolesModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { RolesRaw } from './raw/Roles';

const col = db.collection(`${prefix}roles`);
export const Roles = new RolesRaw(col, { Users, Subscriptions }, trashCollection);
registerModel('IRolesModel', Roles as IRolesModel);
