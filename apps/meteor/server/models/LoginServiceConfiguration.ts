import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { LoginServiceConfigurationRaw } from './raw/LoginServiceConfiguration';

registerModel('ILoginServiceConfigurationModel', new LoginServiceConfigurationRaw(db));
