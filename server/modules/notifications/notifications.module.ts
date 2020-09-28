import { IStreamer } from '../../sdk/types/IStreamService';

export class NotificationsModule {
	private debug = false

	public readonly streamLogged: IStreamer;

	public readonly streamAll: IStreamer;

	public readonly streamRoom: IStreamer;

	public readonly streamRoomUsers: IStreamer;

	public readonly streamUser: IStreamer;

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
		private Streamer: IStreamer,
		private RoomStreamer: IStreamer,
	) {
		this.notifyUser = this.notifyUser.bind(this);

		this.streamAll = new this.Streamer('notify-all');
		this.streamAll.allowWrite('none');
		this.streamAll.allowRead('all');

		this.streamLogged = new this.Streamer('notify-logged');
		this.streamLogged.allowWrite('none');
		this.streamLogged.allowRead('logged');

		this.streamRoom = new this.Streamer('notify-room');
		this.streamRoom.allowWrite('none');
		// this.streamRoom.allowRead(function(eventName, extraData) { // Implemented outside
		// notifications.streamRoom.allowWrite(function(eventName, username, typing, extraData) { // Implemented outside

		this.streamRoomUsers = new this.Streamer('notify-room-users');
		this.streamRoomUsers.allowRead('none');
		// this.streamRoomUsers.allowWrite(function(eventName, ...args) { // Implemented outside

		this.streamUser = new this.RoomStreamer('notify-user');
		this.streamUser.allowWrite('logged');
		this.streamUser.allowRead(function(eventName) {
			const [userId] = eventName.split('/');
			return (this.userId != null) && this.userId === userId;
		});

		this.streamImporters = new this.Streamer('importers', { retransmit: false });
		this.streamImporters.allowRead('all');
		this.streamImporters.allowEmit('all');
		this.streamImporters.allowWrite('none');

		this.streamRoles = new this.Streamer('roles');
		this.streamRoles.allowWrite('none');
		this.streamRoles.allowRead('logged');

		this.streamApps = new this.Streamer('apps', { retransmit: false });
		this.streamApps.serverOnly = true;
		this.streamApps.allowRead('all');
		this.streamApps.allowEmit('all');
		this.streamApps.allowWrite('none');

		this.streamAppsEngine = new this.Streamer('apps-engine', { retransmit: false });
		this.streamAppsEngine.serverOnly = true;
		this.streamAppsEngine.allowRead('none');
		this.streamAppsEngine.allowEmit('all');
		this.streamAppsEngine.allowWrite('none');

		this.streamCannedResponses = new this.Streamer('canned-responses');
		this.streamCannedResponses.allowWrite('none');
		// this.streamCannedResponses.allowRead(function() { // Implemented outside

		this.streamIntegrationHistory = new this.Streamer('integrationHistory');
		this.streamIntegrationHistory.allowWrite('none');
		// this.streamIntegrationHistory.allowRead(function() { // Implemented outside

		this.streamLivechatRoom = new this.Streamer('livechat-room');
		// this.streamLivechatRoom.allowRead((roomId, extraData) => { // Implemented outside

		this.streamLivechatQueueData = new this.Streamer('livechat-inquiry-queue-observer');
		this.streamLivechatQueueData.allowWrite('none');
		// this.streamLivechatQueueData.allowRead(function() { // Implemented outside

		this.streamStdout = new this.Streamer('stdout');
		this.streamStdout.allowWrite('none');
		// this.streamStdout.allowRead(function() { // Implemented outside

		this.streamRoomData = new this.Streamer('room-data');
		this.streamRoomData.allowWrite('none');
		// this.streamRoomData.allowRead(function(rid) { // Implemented outside
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
