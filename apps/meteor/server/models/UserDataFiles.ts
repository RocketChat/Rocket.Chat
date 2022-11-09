import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { UserDataFilesRaw } from './raw/UserDataFiles';

registerModel('IUserDataFilesModel', new UserDataFilesRaw(db));
