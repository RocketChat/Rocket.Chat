import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { RolesRaw } from './raw/Roles';

registerModel('IRolesModel', new RolesRaw(trashCollection));
