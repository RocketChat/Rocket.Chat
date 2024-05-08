import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { PermissionsRaw } from './raw/Permissions';

registerModel('IPermissionsModel', new PermissionsRaw(trashCollection));
