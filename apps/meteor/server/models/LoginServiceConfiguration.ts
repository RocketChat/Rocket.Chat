import { registerModel } from '@rocket.chat/models';

import { LoginServiceConfigurationRaw } from './raw/LoginServiceConfiguration';

registerModel('ILoginServiceConfigurationModel', new LoginServiceConfigurationRaw());
