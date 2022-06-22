import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { EmailInboxRaw } from './raw/EmailInbox';

registerModel('IEmailInboxModel', new EmailInboxRaw(db, trashCollection));
