import { registerModel } from '@rocket.chat/models';

import { UserDataFilesRaw } from './raw/UserDataFiles';

registerModel('IUserDataFilesModel', new UserDataFilesRaw());
