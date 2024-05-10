import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { PermissionsRaw } from './raw/Permissions';

registerModel('IPermissionsModel', new PermissionsRaw(db, trashCollection));
