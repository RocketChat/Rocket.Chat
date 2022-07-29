import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { NotificationQueueRaw } from './raw/NotificationQueue';

registerModel('INotificationQueueModel', new NotificationQueueRaw(db, trashCollection));
