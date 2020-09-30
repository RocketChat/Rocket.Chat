import { IStreamer, IStreamerConstructor } from '../streamer/streamer.module';
import { Authorization } from '../../sdk';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';

interface IModelsParam {
	Rooms: RoomsRaw;
	Subscriptions: SubscriptionsRaw;
}

export class NotificationsModule {
	private debug = false

	public readonly streamLogged: IStreamer;

	public readonly streamAll: IStreamer;

	public readonly streamRoom: IStreamer;

	public readonly streamRoomUsers: IStreamer;

	public readonly streamUser: IStreamer;

	public readonly streamRoomMessage: IStreamer;

	public readonly streamImporters: IStreamer;

	public readonly streamRoles: IStreamer;

	public readonly streamApps: IStreamer;

	public readonly streamAppsEngine: IStreamer;

	public readonly streamCannedResponses: IStreamer;

	public readonly streamIntegrationHistory: IStreamer;

	public readonly streamLivechatRoom: IStreamer;

	public readonly streamLivechatQueueData: IStreamer;

	public readonly streamStdout: IStreamer;

	public readonly streamRoomData: IStreamer;

	constructor(
		private Streamer: IStreamerConstructor,
		private RoomStreamer: IStreamerConstructor,
		private MessageStreamer: IStreamerConstructor,
	) {
		// this.notifyUser = this.notifyUser.bind(this);

		this.streamAll = new this.Streamer('notify-all');
		this.streamLogged = new this.Streamer('notify-logged');
		this.streamRoom = new this.Streamer('notify-room');
		this.streamRoomUsers = new this.Streamer('notify-room-users');
		this.streamRoomMessage = new this.MessageStreamer('room-messages');
		this.streamUser = new this.RoomStreamer('notify-user');
		this.streamImporters = new this.Streamer('importers', { retransmit: false });
		this.streamRoles = new this.Streamer('roles');
		this.streamApps = new this.Streamer('apps', { retransmit: false });
		this.streamAppsEngine = new this.Streamer('apps-engine', { retransmit: false });
		this.streamCannedResponses = new this.Streamer('canned-responses');
		this.streamIntegrationHistory = new this.Streamer('integrationHistory');
		this.streamLivechatRoom = new this.Streamer('livechat-room');
		this.streamLivechatQueueData = new this.Streamer('livechat-inquiry-queue-observer');
		this.streamStdout = new this.Streamer('stdout');
		this.streamRoomData = new this.Streamer('room-data');
	}

	async configure({ Rooms, Subscriptions }: IModelsParam): Promise<void> {
		this.streamRoomMessage.allowWrite('none');
		this.streamRoomMessage.allowRead(async function(eventName /* , args*/) {
			const room = await Rooms.findOneById(eventName);
			if (!room) {
				return false;
			}

			const canAccess = await Authorization.canAccessRoom(room, { _id: this.userId });
			if (!canAccess) {
				// verify if can preview messages from public channels
				if (room.t === 'c') {
					return Authorization.hasPermission(this.userId, 'preview-c-room');
				}
				return false;
			}

			return true;
		});

		// TODO need to test
		this.streamRoomMessage.allowRead('__my_messages__', 'all');
		this.streamRoomMessage.allowEmit('__my_messages__', async function(_eventName, { rid }) {
			try {
				const room = await Rooms.findOneById(rid);
				if (!room) {
					return false;
				}

				const canAccess = await Authorization.canAccessRoom(room, { _id: this.userId });
				if (!canAccess) {
					return false;
				}

				const roomParticipant = await Subscriptions.countByRoomIdAndUserId(room._id, this.userId);

				return {
					roomParticipant: roomParticipant > 0,
					roomType: room.t,
					roomName: room.name,
				};
			} catch (error) {
				/* error*/
				return false;
			}
		});

		this.streamAll.allowWrite('none');
		this.streamAll.allowRead('all');

		this.streamLogged.allowWrite('none');
		this.streamLogged.allowRead('logged');

		this.streamRoom.allowWrite('none');
		// this.streamRoom.allowRead(function(eventName, extraData) { // Implemented outside
		// notifications.streamRoom.allowWrite(function(eventName, username, typing, extraData) { // Implemented outside

		this.streamRoomUsers.allowRead('none');
		// this.streamRoomUsers.allowWrite(function(eventName, ...args) { // Implemented outside

		this.streamUser.allowWrite('logged');
		this.streamUser.allowRead(async function(eventName) {
			const [userId] = eventName.split('/');
			return (this.userId != null) && this.userId === userId;
		});

		this.streamImporters.allowRead('all');
		this.streamImporters.allowEmit('all');
		this.streamImporters.allowWrite('none');

		this.streamApps.serverOnly = true;
		this.streamApps.allowRead('all');
		this.streamApps.allowEmit('all');
		this.streamApps.allowWrite('none');

		this.streamAppsEngine.serverOnly = true;
		this.streamAppsEngine.allowRead('none');
		this.streamAppsEngine.allowEmit('all');
		this.streamAppsEngine.allowWrite('none');

		this.streamCannedResponses.allowWrite('none');
		// this.streamCannedResponses.allowRead(function() { // Implemented outside

		this.streamIntegrationHistory.allowWrite('none');
		// this.streamIntegrationHistory.allowRead(function() { // Implemented outside

		// this.streamLivechatRoom.allowRead((roomId, extraData) => { // Implemented outside

		this.streamLivechatQueueData.allowWrite('none');
		// this.streamLivechatQueueData.allowRead(function() { // Implemented outside

		this.streamStdout.allowWrite('none');
		// this.streamStdout.allowRead(function() { // Implemented outside

		this.streamRoomData.allowWrite('none');
		// this.streamRoomData.allowRead(function(rid) { // Implemented outside

		this.streamRoles.allowWrite('none');
		this.streamRoles.allowRead('logged');
	}

	notifyAll(eventName: string, ...args: any[]): void {
		if (this.debug === true) {
			console.log('notifyAll', [eventName, ...args]);
		}
		return this.streamAll.emit(eventName, ...args);
	}

	notifyLogged(eventName: string, ...args: any[]): void {
		if (this.debug === true) {
			console.log('notifyLogged', [eventName, ...args]);
		}
		return this.streamLogged.emit(eventName, ...args);
	}

	notifyRoom(room: string, eventName: string, ...args: any[]): void {
		if (this.debug === true) {
			console.log('notifyRoom', [room, eventName, ...args]);
		}
		return this.streamRoom.emit(`${ room }/${ eventName }`, ...args);
	}

	notifyUser(userId: string, eventName: string, ...args: any[]): void {
		if (this.debug === true) {
			console.log('notifyUser', [userId, eventName, ...args]);
		}
		return this.streamUser.emit(`${ userId }/${ eventName }`, ...args);
	}

	notifyAllInThisInstance(eventName: string, ...args: any[]): void {
		if (this.debug === true) {
			console.log('notifyAll', [eventName, ...args]);
		}
		return this.streamAll.emitWithoutBroadcast(eventName, ...args);
	}

	notifyLoggedInThisInstance(eventName: string, ...args: any[]): void {
		if (this.debug === true) {
			console.log('notifyLogged', [eventName, ...args]);
		}
		return this.streamLogged.emitWithoutBroadcast(eventName, ...args);
	}

	notifyRoomInThisInstance(room: string, eventName: string, ...args: any[]): void {
		if (this.debug === true) {
			console.log('notifyRoomAndBroadcast', [room, eventName, ...args]);
		}
		return this.streamRoom.emitWithoutBroadcast(`${ room }/${ eventName }`, ...args);
	}

	notifyUserInThisInstance(userId: string, eventName: string, ...args: any[]): void {
		if (this.debug === true) {
			console.log('notifyUserAndBroadcast', [userId, eventName, ...args]);
		}
		return this.streamUser.emitWithoutBroadcast(`${ userId }/${ eventName }`, ...args);
	}

	progressUpdated(progress: {rate: number}): void {
		this.streamImporters.emit('progress', progress);
	}
}
