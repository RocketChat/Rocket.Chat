import { registerModel, registerModels, UsersRaw } from '@rocket.chat/models';

import { trashCollection } from './database/trash';
import { db } from './database/utils';

registerModels(db, trashCollection);

// Keep registering this way until the model is refactored to TypeScript
registerModel('IUsersModel', new UsersRaw(db, trashCollection));
