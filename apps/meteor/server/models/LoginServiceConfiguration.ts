import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { LoginServiceConfigurationRaw } from './raw/LoginServiceConfiguration';

registerModel('ILoginServiceConfigurationModel', new LoginServiceConfigurationRaw(db, trashCollection));
