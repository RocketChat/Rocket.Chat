import { ServiceClass } from '../../sdk/types/ServiceClass';
import { NotificationsModule } from '../../modules/notifications/notifications.module';

const STATUS_MAP: {[k: string]: number} = {
	offline: 0,
	online: 1,
	away: 2,
	busy: 3,
};

// TODO: Convert to module and implement/import on monolith and on DDPStreamer
export class NotificationService extends ServiceClass {
	protected name = 'notification';

	constructor(
		notifications: NotificationsModule,
	) {
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

		this.onEvent('room.avatarUpdate', ({ _id: rid, avatarETag: etag }) => {
			notifications.notifyLogged('updateAvatar', {
				rid,
				etag,
			});
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

		this.onEvent('user.nameChanged', (user) => {
			notifications.notifyLogged('Users:NameChanged', user);
		});

		this.onEvent('user.roleUpdate', (update) => {
			notifications.notifyLogged('roles-change', update);
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

		this.onEvent('user.updateCustomStatus', (userStatus) => {
			notifications.notifyLogged('updateCustomUserStatus', {
				userStatusData: userStatus,
			});
		});

		this.onEvent('watch.messages', ({ message }) => {
			if (!message.rid) {
				return;
			}

			notifications.streamRoomMessage._emit('__my_messages__', [message], undefined, false, (streamer, _sub, eventName, args, allowed) => streamer.changedPayload(streamer.subscriptionName, 'id', {
				eventName,
				args: [args, allowed],
			}));

			notifications.streamRoomMessage.emitWithoutBroadcast(message.rid, message);
		});

		this.onEvent('watch.subscriptions', ({ clientAction, subscription }) => {
			if (!subscription.u?._id) {
				return;
			}

			// emit a removed event on msg stream to remove the user's stream-room-messages subscription when the user is removed from room
			if (clientAction === 'removed') {
				notifications.streamRoomMessage.__emit(subscription.u._id, clientAction, subscription);
			}

			notifications.streamUser.__emit(subscription.u._id, clientAction, subscription);

			notifications.notifyUserInThisInstance(
				subscription.u._id,
				'subscriptions-changed',
				clientAction,
				subscription,
			);
		});

		this.onEvent('watch.roles', ({ clientAction, role }): void => {
			const payload = {
				type: clientAction,
				...role,
			};
			notifications.streamRoles.emit('roles', payload);
		});
	}
}
