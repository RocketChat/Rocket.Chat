import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { MessageReadsRaw } from './raw/MessageReads';

registerModel('IMessageReadsModel', new MessageReadsRaw(db));
