import { registerModel } from '@rocket.chat/models';
// import type { IUserDataFilesModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { UserDataFilesRaw } from './raw/UserDataFiles';

const col = db.collection(`${prefix}user_data_files`);
registerModel('IUserDataFilesModel', new UserDataFilesRaw(col, trashCollection));
