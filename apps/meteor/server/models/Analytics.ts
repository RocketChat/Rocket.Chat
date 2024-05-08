import { registerModel } from '@rocket.chat/models';

import { AnalyticsRaw } from './raw/Analytics';

registerModel('IAnalyticsModel', new AnalyticsRaw());
