import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { PersistentQueueModel } from './raw/PersistentQueue';

registerModel('IPersistentQueueModel', new PersistentQueueModel(db));
