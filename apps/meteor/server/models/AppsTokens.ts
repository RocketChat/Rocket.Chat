import { registerModel } from '@rocket.chat/models';

import { AppsTokens } from './raw/AppsTokens';

registerModel('IAppsTokensModel', new AppsTokens());
