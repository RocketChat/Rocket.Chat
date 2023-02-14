import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { NotificationQueueRaw } from './raw/NotificationQueue';

registerModel('INotificationQueueModel', new NotificationQueueRaw(db));
