import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { EmailMessageHistoryRaw } from './raw/EmailMessageHistory';

registerModel('IEmailMessageHistoryModel', new EmailMessageHistoryRaw(db));
