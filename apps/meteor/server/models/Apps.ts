import { registerModel } from '@rocket.chat/models';

import { AppsModel } from './raw/Apps';

registerModel('IAppsModel', new AppsModel());
