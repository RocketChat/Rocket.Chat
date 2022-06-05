import { registerModel } from '@rocket.chat/models';
import type { IEmailMessageHistoryModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { EmailMessageHistoryRaw } from './raw/EmailMessageHistory';

const col = db.collection(`${prefix}email_message_history`);
registerModel('IEmailMessageHistoryModel', new EmailMessageHistoryRaw(col, trashCollection) as IEmailMessageHistoryModel);
