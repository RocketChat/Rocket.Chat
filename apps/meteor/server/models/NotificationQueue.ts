import { registerModel } from '@rocket.chat/models';

import { NotificationQueueRaw } from './raw/NotificationQueue';

registerModel('INotificationQueueModel', new NotificationQueueRaw());
