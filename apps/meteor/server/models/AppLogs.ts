import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { AppsLogsModel } from './raw/AppLogsModel';

registerModel('IAppLogsModel', new AppsLogsModel(db));
