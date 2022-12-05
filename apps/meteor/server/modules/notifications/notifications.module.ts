import type { IStreamer, IStreamerConstructor, IPublication } from 'meteor/rocketchat:streamer';
import type { ISubscription, IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users, Settings } from '@rocket.chat/models';

import { Authorization, VideoConf } from '../../sdk';
import { emit, StreamPresence } from '../../../app/notifications/server/lib/Presence';
import { SystemLogger } from '../../lib/logger/system';
import { streamDeprecationLogger } from '../../../app/lib/server/lib/deprecationWarningLogger';

export class NotificationsModule {
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

	public readonly streamLocal: IStreamer;

	public readonly streamPresence: IStreamer;

	constructor(private Streamer: IStreamerConstructor) {
		this.streamAll = new this.Streamer('notify-all');
		this.streamLogged = new this.Streamer('notify-logged');
		this.streamRoom = new this.Streamer('notify-room');
		this.streamRoomUsers = new this.Streamer('notify-room-users');
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
		this.streamPresence = StreamPresence.getInstance(Streamer, 'user-presence');
		this.streamRoomMessage = new this.Streamer('room-messages');

		this.streamRoomMessage.on('_afterPublish', async (streamer: IStreamer, publication: IPublication, eventName: string): Promise<void> => {
			const { userId } = publication._session;
			if (!userId) {
				return;
			}

			const userEvent = (clientAction: string, { rid }: { rid: string }): void => {
				switch (clientAction) {
					case 'removed':
						streamer.removeListener(userId, userEvent);
						const sub = [...streamer.subscriptions].find((sub) => sub.eventName === rid && sub.subscription.userId === userId);
						sub && streamer.removeSubscription(sub, eventName);
						break;
				}
			};

			streamer.on(userId, userEvent);

			publication.onStop(() => streamer.removeListener(userId, userEvent));
		});

		this.streamUser = new this.Streamer('notify-user');
		this.streamLocal = new this.Streamer('local');
	}

	async configure(): Promise<void> {
		const notifyUser = this.notifyUser.bind(this);

		this.streamRoomMessage.allowWrite('none');
		this.streamRoomMessage.allowRead(async function (eventName, extraData) {
			const room = await Rooms.findOneById(eventName);
			if (!room) {
				return false;
			}

			const canAccess = await Authorization.canAccessRoom(room, { _id: this.userId || '' }, extraData);
			if (!canAccess) {
				// verify if can preview messages from public channels
				if (room.t === 'c' && this.userId) {
					return Authorization.hasPermission(this.userId, 'preview-c-room');
				}
				return false;
			}

			return true;
		});

		this.streamRoomMessage.allowRead('__my_messages__', 'all');
		this.streamRoomMessage.allowEmit('__my_messages__', async function (_eventName, { rid }) {
			if (!this.userId) {
				return false;
			}

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
		this.streamAll.allowRead('private-settings-changed', async function () {
			if (this.userId == null) {
				return false;
			}
			return Authorization.hasAtLeastOnePermission(this.userId, [
				'view-privileged-setting',
				'edit-privileged-setting',
				'manage-selected-settings',
			]);
		});

		this.streamLogged.allowWrite('none');
		this.streamLogged.allowRead('logged');

		this.streamRoom.allowRead(async function (eventName, extraData): Promise<boolean> {
			const [rid, e] = eventName.split('/');

			if (e === 'webrtc') {
				return true;
			}

			const room = await Rooms.findOneById<Pick<IOmnichannelRoom, 't' | 'v' | '_id'>>(rid, {
				projection: { 't': 1, 'v.token': 1 },
			});

			if (!room) {
				return false;
			}

			// typing from livechat widget
			if (extraData?.token) {
				// TODO improve this to make a query 'v.token'
				const room = await Rooms.findOneById<Pick<IOmnichannelRoom, 't' | 'v'>>(rid, {
					projection: { 't': 1, 'v.token': 1 },
				});
				return !!room && room.t === 'l' && room.v.token === extraData.token;
			}

			if (!this.userId) {
				return false;
			}
			const canAccess = await Authorization.canAccessRoomId(room._id, this.userId);

			return canAccess;
		});

		async function canType({
			userId,
			username,
			extraData,
			rid,
		}: {
			userId?: string;
			username: string;
			extraData?: { token: string };
			rid: string;
		}): Promise<boolean> {
			try {
				// typing from livechat widget
				if (extraData?.token) {
					// TODO improve this to make a query 'v.token'
					const room = await Rooms.findOneById<Pick<IOmnichannelRoom, 't' | 'v'>>(rid, {
						projection: { 't': 1, 'v.token': 1 },
					});
					return !!room && room.t === 'l' && room.v.token === extraData.token;
				}

				if (!userId) {
					return false;
				}

				// TODO consider using something to cache settings
				const key = (await Settings.getValueById('UI_Use_Real_Name')) ? 'name' : 'username';

				const user = await Users.findOneById<Pick<IUser, 'name' | 'username'>>(userId, {
					projection: {
						[key]: 1,
					},
				});

				if (!user) {
					return false;
				}

				return user[key] === username;
			} catch (e) {
				SystemLogger.error(e);
				return false;
			}
		}

		const { streamRoom } = this;
		this.streamRoom.allowWrite(async function (eventName, username, _activity, extraData): Promise<boolean> {
			const [rid, e] = eventName.split('/');

			// TODO should this use WEB_RTC_EVENTS enum?
			if (e === 'webrtc') {
				return true;
			}

			// In fact user-activity streamer will handle typing action.
			// Need to use 'typing' streamer till all other clients updated to use user-activity streamer.
			if (e !== 'typing' && e !== 'user-activity') {
				return false;
			}

			if (!(await canType({ extraData, rid, username, userId: this.userId ?? undefined }))) {
				return false;
			}

			// DEPRECATED
			// Keep compatibility between old and new events
			if (e === 'user-activity' && Array.isArray(_activity) && (_activity.length === 0 || _activity.includes('user-typing'))) {
				streamRoom._emit(`${rid}/typing`, [username, _activity.includes('user-typing')], this.connection, true);
			} else if (e === 'typing') {
				streamDeprecationLogger.warn(`The 'typing' event is deprecated and will be removed in the next major version of Rocket.Chat`);
				streamRoom._emit(`${rid}/user-activity`, [username, _activity ? ['user-typing'] : [], extraData], this.connection, true);
			}

			return true;
		});

		this.streamRoomUsers.allowRead('none');
		this.streamRoomUsers.allowWrite(async function (eventName, ...args) {
			const [roomId, e] = eventName.split('/');
			if (!this.userId) {
				const room = await Rooms.findOneById<IOmnichannelRoom>(roomId, {
					projection: { 't': 1, 'servedBy._id': 1 },
				});
				if (room && room.t === 'l' && e === 'webrtc' && room.servedBy) {
					notifyUser(room.servedBy._id, e, ...args);
					return false;
				}
			} else if ((await Subscriptions.countByRoomIdAndUserId(roomId, this.userId)) > 0) {
				const livechatSubscriptions: ISubscription[] = await Subscriptions.findByLivechatRoomIdAndNotUserId(roomId, this.userId, {
					projection: { 'v._id': 1, '_id': 0 },
				}).toArray();
				if (livechatSubscriptions && e === 'webrtc') {
					livechatSubscriptions.forEach((subscription) => subscription.v && notifyUser(subscription.v._id, e, ...args));
					return false;
				}
				const subscriptions: ISubscription[] = await Subscriptions.findByRoomIdAndNotUserId(roomId, this.userId, {
					projection: { 'u._id': 1, '_id': 0 },
				}).toArray();
				subscriptions.forEach((subscription) => notifyUser(subscription.u._id, e, ...args));
			}
			return false;
		});

		this.streamUser.allowWrite(async function (eventName: string, data: unknown) {
			const [, e] = eventName.split('/');
			if (e === 'otr' && (data === 'handshake' || data === 'acknowledge')) {
				const isEnable = await Settings.getValueById('OTR_Enable');
				return Boolean(this.userId) && (isEnable === 'true' || isEnable === true);
			}
			if (e === 'webrtc') {
				return true;
			}
			if (e === 'video-conference') {
				if (!this.userId || !data || typeof data !== 'object') {
					return false;
				}

				const { action: videoAction, params } = data as {
					action: string | undefined;
					params: { callId?: string; uid?: string; rid?: string };
				};

				if (!videoAction || typeof videoAction !== 'string' || !params || typeof params !== 'object') {
					return false;
				}

				const callId = 'callId' in params && typeof params.callId === 'string' ? params.callId : '';
				const uid = 'uid' in params && typeof params.uid === 'string' ? params.uid : '';
				const rid = 'rid' in params && typeof params.rid === 'string' ? params.rid : '';

				return VideoConf.validateAction(videoAction, this.userId, {
					callId,
					uid,
					rid,
				});
			}

			return Boolean(this.userId);
		});
		this.streamUser.allowRead(async function (eventName) {
			const [userId, e] = eventName.split('/');

			if (e === 'otr') {
				const isEnable = await Settings.getValueById('OTR_Enable');
				return Boolean(this.userId) && this.userId === userId && (isEnable === 'true' || isEnable === true);
			}
			if (e === 'webrtc') {
				return true;
			}

			return Boolean(this.userId) && this.userId === userId;
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
		this.streamCannedResponses.allowRead(async function () {
			return (
				!!this.userId &&
				!!(await Settings.getValueById('Canned_Responses_Enable')) &&
				Authorization.hasPermission(this.userId, 'view-canned-responses')
			);
		});

		this.streamIntegrationHistory.allowWrite('none');
		this.streamIntegrationHistory.allowRead(async function () {
			if (!this.userId) {
				return false;
			}
			return Authorization.hasAtLeastOnePermission(this.userId, ['manage-outgoing-integrations', 'manage-own-outgoing-integrations']);
		});

		this.streamLivechatRoom.allowRead(async function (roomId, extraData) {
			const room = await Rooms.findOneById<Pick<IOmnichannelRoom, 't' | 'v'>>(roomId, {
				projection: { _id: 0, t: 1, v: 1 },
			});

			if (!room) {
				console.warn(`Invalid eventName: "${roomId}"`);
				return false;
			}

			if (room.t === 'l' && extraData?.visitorToken && room.v.token === extraData.visitorToken) {
				return true;
			}
			return false;
		});

		this.streamLivechatQueueData.allowWrite('none');
		this.streamLivechatQueueData.allowRead(async function () {
			return this.userId ? Authorization.hasPermission(this.userId, 'view-l-room') : false;
		});

		this.streamStdout.allowWrite('none');
		this.streamStdout.allowRead(async function () {
			if (!this.userId) {
				return false;
			}
			return Authorization.hasPermission(this.userId, 'view-logs');
		});

		this.streamRoomData.allowWrite('none');
		this.streamRoomData.allowRead(async function (rid) {
			if (!this.userId) {
				return false;
			}

			try {
				const room = await Rooms.findOneById(rid);
				if (!room) {
					return false;
				}

				const canAccess = await Authorization.canAccessRoom(room, { _id: this.userId });
				if (!canAccess) {
					return false;
				}

				return true;
			} catch (error) {
				return false;
			}
		});

		this.streamRoles.allowWrite('none');
		this.streamRoles.allowRead('logged');

		this.streamUser.on('_afterPublish', async (streamer: IStreamer, publication: IPublication, eventName: string): Promise<void> => {
			const { userId } = publication._session;
			if (!userId) {
				return;
			}

			if (/rooms-changed/.test(eventName)) {
				// TODO: change this to serialize only once
				const roomEvent = (...args: any[]): void => {
					// TODO if receive a removed event could do => streamer.removeListener(rid, roomEvent);
					const payload = streamer.changedPayload(streamer.subscriptionName, 'id', {
						eventName: `${userId}/rooms-changed`,
						args,
					});

					payload && publication._session.socket?.send(payload);
				};

				const subscriptions = await Subscriptions.find<Pick<ISubscription, 'rid'>>(
					{ 'u._id': userId },
					{ projection: { rid: 1 } },
				).toArray();

				subscriptions.forEach(({ rid }) => {
					streamer.on(rid, roomEvent);
				});

				const userEvent = async (clientAction: string, { rid }: Partial<ISubscription> = {}): Promise<void> => {
					if (!rid) {
						return;
					}

					switch (clientAction) {
						case 'inserted':
							subscriptions.push({ rid });
							streamer.on(rid, roomEvent);

							// after a subscription is added need to emit the room again
							roomEvent('inserted', await Rooms.findOneById(rid));
							break;

						case 'removed':
							streamer.removeListener(rid, roomEvent);
							break;
					}
				};
				streamer.on(userId, userEvent);

				publication.onStop(() => {
					streamer.removeListener(userId, userEvent);
					subscriptions.forEach(({ rid }) => streamer.removeListener(rid, roomEvent));
				});
			}
		});

		this.streamLocal.serverOnly = true;
		this.streamLocal.allowRead('none');
		this.streamLocal.allowEmit('all');
		this.streamLocal.allowWrite('none');

		this.streamPresence.allowRead('logged');
		this.streamPresence.allowWrite('none');
	}

	notifyAll(eventName: string, ...args: any[]): void {
		return this.streamAll.emit(eventName, ...args);
	}

	notifyLogged(eventName: string, ...args: any[]): void {
		return this.streamLogged.emit(eventName, ...args);
	}

	notifyRoom(room: string, eventName: string, ...args: any[]): void {
		return this.streamRoom.emit(`${room}/${eventName}`, ...args);
	}

	notifyUser(userId: string, eventName: string, ...args: any[]): void {
		return this.streamUser.emit(`${userId}/${eventName}`, ...args);
	}

	notifyAllInThisInstance(eventName: string, ...args: any[]): void {
		return this.streamAll.emitWithoutBroadcast(eventName, ...args);
	}

	notifyLoggedInThisInstance(eventName: string, ...args: any[]): void {
		return this.streamLogged.emitWithoutBroadcast(eventName, ...args);
	}

	notifyRoomInThisInstance(room: string, eventName: string, ...args: any[]): void {
		return this.streamRoom.emitWithoutBroadcast(`${room}/${eventName}`, ...args);
	}

	notifyUserInThisInstance(userId: string, eventName: string, ...args: any[]): void {
		return this.streamUser.emitWithoutBroadcast(`${userId}/${eventName}`, ...args);
	}

	sendPresence(uid: string, ...args: any[]): void {
		// if (this.debug === true) {
		// 	console.log('notifyUserAndBroadcast', [userId, eventName, ...args]);
		// }
		emit(uid, args as any);
		return this.streamPresence.emitWithoutBroadcast(uid, ...args);
	}

	progressUpdated(progress: { rate: number }): void {
		this.streamImporters.emit('progress', progress);
	}
}
