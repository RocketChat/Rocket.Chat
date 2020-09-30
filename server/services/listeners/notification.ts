import { ServiceClass } from '../../sdk/types/ServiceClass';
import notifications from '../../../app/notifications/server/lib/Notifications';

const STATUS_MAP: {[k: string]: number} = {
	offline: 0,
	online: 1,
	away: 2,
	busy: 3,
};

export class NotificationService extends ServiceClass {
	protected name = 'notification';

	constructor() {
		super();

		this.onEvent('userpresence', ({ user }) => {
			const {
				_id, username, status, statusText,
			} = user;
			if (!status) {
				return;
			}

			notifications.notifyLogged('user-status', [_id, username, STATUS_MAP[status], statusText]);
		});

		this.onEvent('emoji.deleteCustom', ({ emoji }) => {
			notifications.notifyLogged('deleteEmojiCustom', {
				emojiData: emoji,
			});
		});
	}
}
