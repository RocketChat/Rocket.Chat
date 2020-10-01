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

		this.onEvent('emoji.deleteCustom', (emoji) => {
			notifications.notifyLogged('deleteEmojiCustom', {
				emojiData: emoji,
			});
		});

		this.onEvent('emoji.updateCustom', (emoji) => {
			notifications.notifyLogged('updateEmojiCustom', {
				emojiData: emoji,
			});
		});

		this.onEvent('notify.ephemeralMessage', (uid, rid, message) => {
			notifications.notifyLogged(`${ uid }/message`, {
				groupable: false,
				...message,
				_id: String(Date.now()),
				rid,
				ts: new Date(),
			});
		});

		this.onEvent('permission.changed', ({ clientAction, data }) => {
			notifications.notifyLogged('permissions-changed', clientAction, data);
		});

		this.onEvent('setting.privateChanged', ({ clientAction, setting }) => {
			notifications.notifyLogged('private-settings-changed', clientAction, setting);
		});

		this.onEvent('user.avatarUpdate', ({ username, avatarETag: etag }) => {
			notifications.notifyLogged('updateAvatar', {
				username,
				etag,
			});
		});

		this.onEvent('user.deleted', ({ _id: userId }) => {
			notifications.notifyLogged('Users:Deleted', {
				userId,
			});
		});

		this.onEvent('user.deleteCustomStatus', (userStatus) => {
			notifications.notifyLogged('deleteCustomUserStatus', {
				userStatusData: userStatus,
			});
		});

		this.onEvent('user.updateCustomStatus', (userStatus) => {
			notifications.notifyLogged('updateCustomUserStatus', {
				userStatusData: userStatus,
			});
		});

		this.onEvent('user.nameChanged', (user) => {
			notifications.notifyLogged('Users:NameChanged', user);
		});

		this.onEvent('userpresence', ({ user }) => {
			const {
				_id, username, status, statusText,
			} = user;
			if (!status) {
				return;
			}

			notifications.notifyLogged('user-status', [_id, username, STATUS_MAP[status], statusText]);
		});

		this.onEvent('user.roleUpdate', (update) => {
			notifications.notifyLogged('roles-change', update);
		});
	}
}
