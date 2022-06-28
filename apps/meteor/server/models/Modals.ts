import { registerModel } from '@rocket.chat/models';

import { ModalsRaw } from './raw/Modals';
import { db } from '../database/utils';
import { trashCollection } from '../database/trash';

registerModel('IModalModel', new ModalsRaw(db, trashCollection));
