import { ServiceClass } from '../../sdk/types/ServiceClass';
import { IStreamService, STATUS_MAP, IStreamer, IStreamerConstructor } from '../../sdk/types/IStreamService';
// import { Notifications } from '../../../app/notifications/server';
import { IMessage } from '../../../definition/IMessage';

export class StreamService extends ServiceClass implements IStreamService {
	protected name = 'streamer';

	private streamLogged: IStreamer;

	private streamAll: IStreamer;

	private streamRoom: IStreamer;

	private streamRoomUsers: IStreamer;

	private streamUser: IStreamer;

	constructor(Streamer: IStreamerConstructor) {
		super();

		this.streamLogged = new Streamer('notify-logged');
		this.streamAll = new Streamer('notify-all');
		this.streamRoom = new Streamer('notify-room');
		this.streamRoomUsers = new Streamer('notify-room-users');
		this.streamUser = new Streamer('notify-user');

		this.streamAll.allowWrite('none');
		this.streamLogged.allowWrite('none');
		this.streamRoom.allowWrite('none');
		// TODO: Missing models for this code
		// this.streamRoomUsers.allowWrite(function(eventName, ...args) {
		// 	const [roomId, e] = eventName.split('/');
		// 	if (Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId) != null) {
		// 		const subscriptions = Subscriptions.findByRoomIdAndNotUserId(roomId, this.userId).fetch();
		// 		subscriptions.forEach((subscription) => self.notifyUser(subscription.u._id, e, ...args));
		// 	}
		// 	return false;
		// });
		this.streamUser.allowWrite('logged');
		this.streamAll.allowRead('all');
		this.streamLogged.allowRead('logged');
		// TODO: Missing models for this code
		// this.streamRoom.allowRead(function(eventName, extraData) {
		// 	const [roomId] = eventName.split('/');
		// 	const room = Rooms.findOneById(roomId);
		// 	if (!room) {
		// 		console.warn(`Invalid streamRoom eventName: "${ eventName }"`);
		// 		return false;
		// 	}
		// 	if (room.t === 'l' && extraData && extraData.token && room.v.token === extraData.token) {
		// 		return true;
		// 	}
		// 	if (this.userId == null) {
		// 		return false;
		// 	}
		// 	const subscription = Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId, { fields: { _id: 1 } });
		// 	return subscription != null;
		// });
		this.streamRoomUsers.allowRead('none');
		this.streamUser.allowRead(function(eventName) {
			const [userId] = eventName.split('/');
			return (this.userId != null) && this.userId === userId;
		});
	}

	sendDeleteCustomEmoji(emojiData: Record<string, any>): void {
		this.streamLogged.emit('deleteEmojiCustom', {
			emojiData,
		});
	}

	sendUpdateCustomEmoji(emojiData: Record<string, any>): void {
		this.streamLogged.emit('updateEmojiCustom', {
			emojiData,
		});
	}

	sendUserDeleted(uid: string): void {
		this.streamLogged.emit('Users:Deleted', {
			userId: uid,
		});
	}

	sendUserNameChanged(userData: Record<string, any>): void {
		this.streamLogged.emit('Users:NameChanged', userData);
	}

	sendDeleteCustomUserStatus(userStatusData: Record<string, any>): void {
		this.streamLogged.emit('deleteCustomUserStatus', {
			userStatusData,
		});
	}

	sendUpdateCustomUserStatus(userStatusData: Record<string, any>): void {
		this.streamLogged.emit('updateCustomUserStatus', {
			userStatusData,
		});
	}

	sendPermission({ clientAction, data }: any): void {
		this.streamLogged.emitWithoutBroadcast('permissions-changed', clientAction, data);
	}

	sendPrivateSetting({ clientAction, setting }: any): void {
		this.streamLogged.emitWithoutBroadcast('private-settings-changed', clientAction, setting);
	}

	sendUserAvatarUpdate({ username, etag }: { username: string; etag?: string }): void {
		this.streamLogged.emit('updateAvatar', {
			username,
			etag,
		});
	}

	sendRoomAvatarUpdate({ rid, etag }: { rid: string; etag?: string }): void {
		this.streamLogged.emit('updateAvatar', {
			rid,
			etag,
		});
	}

	sendRoleUpdate(update: Record<string, any>): void {
		this.streamLogged.emit('roles-change', update);
	}

	sendEphemeralMessage(uid: string, rid: string, message: Partial<IMessage>): void {
		this.notifyUser(uid, 'message', {
			groupable: false,
			...message,
			_id: String(Date.now()),
			rid,
			ts: new Date(),
		});
	}

	notifyAll(eventName: string, ...args: any[]): void {
		console.log('notifyAll', eventName, args);
	}

	notifyUser(uid: string, eventName: string, ...args: any[]): void {
		console.log('notifyUser', uid, eventName, args);
		// if (this.debug === true) {
		// 	console.log('notifyUser', [userId, eventName, ...args]);
		// }

		return this.streamUser.emit(`${ uid }/${ eventName }`, ...args);
	}
}
