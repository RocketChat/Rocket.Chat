import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { EmailMessageHistoryRaw } from './raw/EmailMessageHistory';

registerModel('IEmailMessageHistoryModel', new EmailMessageHistoryRaw(db, trashCollection));
