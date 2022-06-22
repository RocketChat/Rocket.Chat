import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { AnalyticsRaw } from './raw/Analytics';

registerModel('IAnalyticsModel', new AnalyticsRaw(db));
