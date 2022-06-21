import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { PermissionsRaw } from './raw/Permissions';

const col = db.collection(`${prefix}permissions`);
export const Permissions = new PermissionsRaw(col, trashCollection);
registerModel('IPermissionsModel', Permissions);
