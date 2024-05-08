import { registerModel } from '@rocket.chat/models';

import { EmailInboxRaw } from './raw/EmailInbox';

registerModel('IEmailInboxModel', new EmailInboxRaw());
