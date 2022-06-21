import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { RolesRaw } from './raw/Roles';

const col = db.collection(`${prefix}roles`);
export const Roles = new RolesRaw(col, trashCollection);
registerModel('IRolesModel', Roles);
