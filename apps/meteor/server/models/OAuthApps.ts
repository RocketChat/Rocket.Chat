import { registerModel } from '@rocket.chat/models';

import { OAuthAppsRaw } from './raw/OAuthApps';

registerModel('IOAuthAppsModel', new OAuthAppsRaw());
