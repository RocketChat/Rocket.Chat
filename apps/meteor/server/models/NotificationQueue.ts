import { registerModel } from '@rocket.chat/models';
import type { INotificationQueueModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { NotificationQueueRaw } from './raw/NotificationQueue';

const col = db.collection(`${prefix}notification_queue`);
registerModel('INotificationQueueModel', new NotificationQueueRaw(col, trashCollection) as INotificationQueueModel);
