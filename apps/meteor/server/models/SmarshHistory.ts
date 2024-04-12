import { registerModel } from '@rocket.chat/models';

import { SmarshHistoryRaw } from './raw/SmarshHistory';

registerModel('ISmarshHistoryModel', new SmarshHistoryRaw());
