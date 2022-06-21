import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { EmailMessageHistoryRaw } from './raw/EmailMessageHistory';

const col = db.collection(`${prefix}email_message_history`);
registerModel('IEmailMessageHistoryModel', new EmailMessageHistoryRaw(col, trashCollection));
