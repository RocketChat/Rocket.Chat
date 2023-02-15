import type { INotificationService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';

import notifications from '../../../app/notifications/server/lib/Notifications';

export class NotificationService extends ServiceClassInternal implements INotificationService {
	protected name = 'notification';

	notifyRoom(room: string, eventName: string, ...args: any[]): void {
		notifications.notifyRoom(room, eventName, ...args);
	}
}
