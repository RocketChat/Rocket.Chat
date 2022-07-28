import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { RolesRaw } from './raw/Roles';

registerModel('IRolesModel', new RolesRaw(db, trashCollection));
