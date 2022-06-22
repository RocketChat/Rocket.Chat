import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { OmnichannelQueueRaw } from './raw/OmnichannelQueue';

registerModel('IOmnichannelQueueModel', new OmnichannelQueueRaw(db, trashCollection));
