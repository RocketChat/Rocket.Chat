import { registerModel } from '@rocket.chat/models';

import { EmailMessageHistoryRaw } from './raw/EmailMessageHistory';

registerModel('IEmailMessageHistoryModel', new EmailMessageHistoryRaw());
