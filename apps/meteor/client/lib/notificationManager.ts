import { Emitter } from '@rocket.chat/emitter';

class NotificationPermissionEmitter extends Emitter {
	allowed: boolean;
}
export const notificationManager = new NotificationPermissionEmitter();
