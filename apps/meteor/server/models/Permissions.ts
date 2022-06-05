import { registerModel } from '@rocket.chat/models';
import type { IPermissionsModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { PermissionsRaw } from './raw/Permissions';

const col = db.collection(`${prefix}permissions`);
export const Permissions = new PermissionsRaw(col, trashCollection);
registerModel('IPermissionsModel', Permissions as IPermissionsModel);
