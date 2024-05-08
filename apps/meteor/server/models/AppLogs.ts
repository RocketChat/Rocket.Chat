import { registerModel } from '@rocket.chat/models';

import { AppsLogsModel } from './raw/AppLogsModel';

registerModel('IAppLogsModel', new AppsLogsModel());
