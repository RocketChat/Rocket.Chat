import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { AppsLogsRaw } from './raw/AppsLogs';

registerModel('IAppsLogsModel', new AppsLogsRaw(db));
