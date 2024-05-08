import { registerModel } from '@rocket.chat/models';

import { MessageReadsRaw } from './raw/MessageReads';

registerModel('IMessageReadsModel', new MessageReadsRaw());
