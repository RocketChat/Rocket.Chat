import notifications from '../../../app/notifications/server/lib/Notifications';
import type { INotificationService } from '../../sdk/types/INotificationService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';

export class NotificationService extends ServiceClassInternal implements INotificationService {
	protected name = 'notification';

	notifyRoom(room: string, eventName: string, ...args: any[]): void {
		notifications.notifyRoom(room, eventName, ...args);
	}
}
