import { registerModel } from '@rocket.chat/models';
import type { IEmailInboxModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { EmailInboxRaw } from './raw/EmailInbox';

const col = db.collection(`${prefix}email_inbox`);
export const EmailInbox = new EmailInboxRaw(col, trashCollection);
registerModel('IEmailInboxModel', EmailInbox as IEmailInboxModel);
