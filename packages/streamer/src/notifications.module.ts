import { api, Authorization, MediaCall, VideoConf, Settings } from '@rocket.chat/core-services';
import type { RelayedStreamEvent } from '@rocket.chat/core-services';
import type {
	IImportProgress,
	ISubscription,
	IOmnichannelRoom,
	IUser,
	IUserDataEvent,
	PresenceSource,
	PresenceStatusCode,
} from '@rocket.chat/core-typings';
import type { StreamerCallbackArgs, StreamKeys, StreamNames } from '@rocket.chat/ddp-client';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Subscriptions, Users, VideoConference } from '@rocket.chat/models';

import { emit, StreamPresence } from './StreamPresence';
import { getCachedUserForPublication } from './publication-user-cache';
import { Streamer as StreamerModule } from './streamer.module';
import type { IStreamer, IStreamerConstructor, StreamRelay } from './types';

const logger = new Logger('NotificationsModule');

export type UserActivity = {
	rid: string;
	uid: string;
	activities: string[];
};

export class NotificationsModule {
	public readonly streamLogged: IStreamer<'notify-logged'>;

	public readonly streamAll: IStreamer<'notify-all'>;

	public readonly streamRoom: IStreamer<'notify-room'>;

	public readonly streamRoomUsers: IStreamer<'notify-room-users'>;

	public readonly streamUser: IStreamer<'notify-user'> & {
		on(event: string, fn: (...data: any[]) => void): void;
	};

	public readonly streamRoomMessage: IStreamer<'room-messages'>;

	public readonly streamImporters: IStreamer<'importers'>;

	public readonly streamRoles: IStreamer<'roles'>;

	public readonly streamApps: IStreamer<'apps'>;

	public readonly streamAppsEngine: IStreamer<'apps-engine'>;

	public readonly streamCannedResponses: IStreamer<'canned-responses'>;

	public readonly streamIntegrationHistory: IStreamer<'integrationHistory'>;

	public readonly streamLivechatRoom: IStreamer<'livechat-room'>;

	public readonly streamLivechatQueueData: IStreamer<'livechat-inquiry-queue-observer'>;

	public readonly streamRoomData: IStreamer<'room-data'>;

	public readonly streamPresence: IStreamer<'user-presence'>;

	public readonly streamVideoConference: IStreamer<'video-conference'>;

	private readonly streams = new Map<string, IStreamer<StreamNames>>();

	private readonly userActivityHandlers = new Set<(activity: UserActivity) => void>();

	private readonly relay: StreamRelay = (stream, eventName, args) => {
		api.broadcast('stream', { stream, eventName, args, origin: this.originId }).catch((err) => {
			logger.error({ msg: 'Failed to relay stream event', stream, eventName, err });
		});
	};

	constructor(
		private Streamer: IStreamerConstructor,
		/** Identifies this process among every process that hosts the same streams. */
		private readonly originId: string,
	) {
		this.streamAll = this.createStream('notify-all');
		this.streamLogged = this.createStream('notify-logged');
		this.streamRoom = this.createStream('notify-room');
		this.streamRoomUsers = this.createStream('notify-room-users');
		this.streamImporters = this.createStream('importers', { retransmit: false });
		this.streamRoles = this.createStream('roles');
		this.streamApps = this.createStream('apps', { retransmit: false });
		this.streamAppsEngine = this.createStream('apps-engine', { retransmit: false });
		this.streamCannedResponses = this.createStream('canned-responses');
		this.streamIntegrationHistory = this.createStream('integrationHistory');
		this.streamLivechatRoom = this.createStream('livechat-room');
		this.streamLivechatQueueData = this.createStream('livechat-inquiry-queue-observer');
		this.streamRoomData = this.createStream('room-data');
		this.streamPresence = this.register(StreamPresence.getInstance(Streamer, 'user-presence', { relay: this.relay }));
		this.streamRoomMessage = this.createStream('room-messages');

		this.streamRoomMessage.on('_afterPublish', async (streamer, publication, eventName): Promise<void> => {
			if (!StreamerModule.isPublicationActive(publication)) {
				return;
			}

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

		this.streamUser = this.createStream('notify-user');
		this.streamVideoConference = this.createStream('video-conference');
	}

	private createStream<N extends StreamNames>(name: N, options?: { retransmit?: boolean }): IStreamer<N> {
		return this.register(new this.Streamer(name, { ...options, relay: this.relay }));
	}

	private register<N extends StreamNames>(stream: IStreamer<N>): IStreamer<N> {
		this.streams.set(stream.name, stream as IStreamer<StreamNames>);
		return stream;
	}

	getStream(name: string): IStreamer<StreamNames> | undefined {
		return this.streams.get(name);
	}

	/** Runs `handler` for every user activity a client of this process reports on a room. */
	onUserActivity(handler: (activity: UserActivity) => void): () => void {
		this.userActivityHandlers.add(handler);
		return () => this.userActivityHandlers.delete(handler);
	}

	/** Delivers an emit relayed from another process to this process's subscribers. */
	deliverRelayed({ stream, eventName, args, origin }: RelayedStreamEvent): void {
		if (origin === this.originId) {
			return;
		}

		this.streams.get(stream)?._emit(eventName, args, undefined, false);
	}

	configure(): void {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;

		this.streamRoomMessage.allowWrite('none');
		this.streamRoomMessage.allowRead(async function (eventName, extraData) {
			const room = await Rooms.findOneById(eventName);
			if (!room) {
				return false;
			}

			const user = await getCachedUserForPublication(this);
			return Authorization.canReadRoom(room, user ?? undefined, extraData);
		});

		this.streamRoomMessage.allowRead('__my_messages__', 'all');
		this.streamRoomMessage.allowEmit('__my_messages__', async function (_eventName, { rid }) {
			const user = await getCachedUserForPublication(this);
			if (!user) {
				return false;
			}

			try {
				const room = await Rooms.findOneById(rid);
				if (!room) {
					return false;
				}

				const canAccess = await Authorization.canAccessRoom(room, user);
				if (!canAccess) {
					return false;
				}

				const roomParticipant = await Subscriptions.countByRoomIdAndUserId(room._id, user._id);

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
		this.streamLogged.allowRead('private-settings-changed', async function () {
			const user = await getCachedUserForPublication(this);
			if (!user) {
				return false;
			}
			return Authorization.hasAtLeastOnePermission(user, [
				'view-privileged-setting',
				'edit-privileged-setting',
				'manage-selected-settings',
			]);
		});

		this.streamLogged.allowWrite('none');
		this.streamLogged.allowRead('logged');

		this.streamRoom.allowRead(async function (eventName, extraData): Promise<boolean> {
			const [rid] = eventName.split('/');

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

			const user = await getCachedUserForPublication(this);
			if (!user) {
				return false;
			}
			const canAccess = await Authorization.canAccessRoom(room, user);

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
				const key = (await Settings.get('UI_Use_Real_Name')) ? 'name' : 'username';

				const user = await Users.findOneById<Pick<IUser, 'name' | 'username'>>(userId, {
					projection: {
						[key]: 1,
					},
				});

				if (!user) {
					return false;
				}

				return user[key] === username;
			} catch (err) {
				logger.error({ err });
				return false;
			}
		}

		this.streamRoom.allowWrite(async function (eventName, username, _activity, extraData): Promise<boolean> {
			const [rid, e] = eventName.split('/');

			if (e !== 'user-activity') {
				return false;
			}

			if (!(await canType({ extraData, rid, username, userId: this.userId ?? undefined }))) {
				return false;
			}

			return true;
		});

		this.streamRoom.on('_afterWrite', (eventName, args, uid) => {
			const [rid, e] = eventName.split('/');
			if (e !== 'user-activity' || !uid) {
				return;
			}

			const [, activities] = args;
			const activity = { rid, uid, activities: Array.isArray(activities) ? activities : [] };
			this.userActivityHandlers.forEach((handler) => handler(activity));
		});

		this.streamRoomUsers.allowRead('none');
		this.streamRoomUsers.allowWrite(async function (
			eventName: `${string}/video-conference` | `${string}/userData`,
			...args: [{ action: string; params: { callId: string; uid: string; rid: string } }] | [IUserDataEvent]
		) {
			const [roomId, e] = eventName.split('/') as [string, 'video-conference' | 'userData'];
			if (
				this.userId &&
				['video-conference', 'userData'].includes(e) &&
				(await Subscriptions.countByRoomIdAndUserId(roomId, this.userId)) > 0
			) {
				const subscriptions: ISubscription[] = await Subscriptions.findByRoomIdAndNotUserId(roomId, this.userId, {
					projection: { 'u._id': 1, '_id': 0 },
				}).toArray();

				subscriptions.forEach((subscription) => self.notifyUser(subscription.u._id, e, ...args));
			}
			return false;
		});

		this.streamUser.allowWrite(async function (eventName, data: unknown) {
			const [, e] = eventName.split('/');
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

			if (e === 'media-calls') {
				if (!this.userId || !data || typeof data !== 'string') {
					return false;
				}

				void MediaCall.processSerializedSignal(this.userId, data).catch(() => null);

				// media call signals don't ever need to be broadcasted
				return false;
			}

			return false;
		});
		this.streamUser.allowRead(async function (eventName) {
			const [userId] = eventName.split('/');

			return Boolean(this.userId) && this.userId === userId;
		});

		this.streamImporters.allowRead('all');
		this.streamImporters.allowEmit('all');
		this.streamImporters.allowWrite('none');

		this.streamApps.allowRead('all');
		this.streamApps.allowEmit('all');
		this.streamApps.allowWrite('none');

		this.streamAppsEngine.allowRead('none');
		this.streamAppsEngine.allowEmit('all');
		this.streamAppsEngine.allowWrite('none');

		this.streamCannedResponses.allowWrite('none');
		this.streamCannedResponses.allowRead(async function () {
			const user = await getCachedUserForPublication(this);
			return !!user && !!(await Settings.get('Canned_Responses_Enable')) && Authorization.hasPermission(user, 'view-canned-responses');
		});

		this.streamIntegrationHistory.allowWrite('none');
		this.streamIntegrationHistory.allowRead(async function () {
			const user = await getCachedUserForPublication(this);
			if (!user) {
				return false;
			}
			return Authorization.hasAtLeastOnePermission(user, ['manage-outgoing-integrations', 'manage-own-outgoing-integrations']);
		});

		this.streamLivechatRoom.allowRead(async (roomId, extraData) => {
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
			const user = await getCachedUserForPublication(this);
			return user ? Authorization.hasPermission(user, 'view-l-room') : false;
		});

		this.streamRoomData.allowWrite('none');
		this.streamRoomData.allowRead(async function (rid) {
			const user = await getCachedUserForPublication(this);
			if (!user) {
				return false;
			}

			try {
				const room = await Rooms.findOneById(rid);
				if (!room) {
					return false;
				}

				const canAccess = await Authorization.canAccessRoom(room, user);
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

		this.streamUser.on('_afterPublish', async (streamer, publication, eventName): Promise<void> => {
			// after meteor 3.4.1 immediately after a disconnection session becomes null (which is not wrong)
			// we were just not counting on this, session is _session so we actually should not use it
			// now after any await, the session can potentially be null, so we need to check for that
			if (!StreamerModule.isPublicationActive(publication)) {
				return;
			}

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
					if (!payload) {
						return;
					}

					// after meteor 3.4.1 immediately after a disconnection session becomes null (which is not wrong)
					// we were just not counting on this, session is _session so we actually should not use it
					// now after any await, the session can potentially be null, so we need to check for that
					if (!StreamerModule.isPublicationActive(publication)) {
						return;
					}
					publication._session.socket.send(payload);
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

		this.streamVideoConference.allowWrite('none');
		// Conference membership authorizes following the call — members may have no access to the room it
		// originated in — and so does access to a room the chat lives in. `canAccessConference` is the same rule
		// the REST endpoints apply, shared so the stream and the endpoints cannot drift into different answers
		// for the same person: membership alone would refuse a room member who opens the conference before their
		// join lands, and a refused subscription is never retried.
		this.streamVideoConference.allowRead(async function (eventName) {
			const user = await getCachedUserForPublication(this);
			if (!user) {
				return false;
			}

			const [callId] = eventName.split('/');
			const call = await VideoConference.findOneById(callId, { projection: { users: 1, rid: 1, discussionRid: 1 } });
			if (!call) {
				return false;
			}

			return Authorization.canAccessConference(call, user._id);
		});

		this.streamPresence.allowRead('logged');
		this.streamPresence.allowWrite('none');
	}

	// notifyAll<E extends StreamKeys<'notify-all'>>(eventName: E, ...args: StreamerCallbackArgs<'notify-all', E>): void {
	// 	return this.streamAll.emit(eventName, ...args);
	// }

	notifyLogged<E extends StreamKeys<'notify-logged'>>(eventName: E, ...args: StreamerCallbackArgs<'notify-logged', E>): void {
		return this.streamLogged.emit(eventName, ...args);
	}

	notifyRoom<P extends string, E extends string>(
		room: P,
		eventName: E extends ExtractNotifyUserEventName<'notify-room', P> ? E : never,
		...args: E extends ExtractNotifyUserEventName<'notify-room', P> ? StreamerCallbackArgs<'notify-room', `${P}/${E}`> : never
	): void {
		return this.streamRoom.emit(`${room}/${eventName}`, ...args);
	}

	notifyUser<P extends string, E extends string>(
		userId: P,
		eventName: E extends ExtractNotifyUserEventName<'notify-user', P> ? E : never,
		...args: E extends ExtractNotifyUserEventName<'notify-user', P> ? StreamerCallbackArgs<'notify-user', `${P}/${E}`> : never
	): void {
		return this.streamUser.emit(`${userId}/${eventName}`, ...args);
	}

	notifyAllInThisInstance<E extends StreamKeys<'notify-all'>>(eventName: E, ...args: StreamerCallbackArgs<'notify-all', E>): void {
		return this.streamAll.emitWithoutBroadcast(eventName, ...args);
	}

	notifyLoggedInThisInstance<E extends StreamKeys<'notify-logged'>>(eventName: E, ...args: StreamerCallbackArgs<'notify-logged', E>): void {
		return this.streamLogged.emitWithoutBroadcast(eventName, ...args);
	}

	notifyRoomInThisInstance<P extends string, E extends string>(
		room: P,
		eventName: E extends ExtractNotifyUserEventName<'notify-room', P> ? E : never,
		...args: E extends ExtractNotifyUserEventName<'notify-room', P> ? StreamerCallbackArgs<'notify-room', `${P}/${E}`> : never
	): void {
		return this.streamRoom.emitWithoutBroadcast(`${room}/${eventName}`, ...args);
	}

	notifyUserInThisInstance<P extends string, E extends string>(
		userId: P,
		eventName: E extends ExtractNotifyUserEventName<'notify-user', P> ? E : never,
		...args: E extends ExtractNotifyUserEventName<'notify-user', P> ? StreamerCallbackArgs<'notify-user', `${P}/${E}`> : never
	): void {
		return this.streamUser.emitWithoutBroadcast(`${userId}/${eventName}`, ...args);
	}

	sendPresence(
		uid: string,
		...args: [username: string, status?: PresenceStatusCode, statusText?: string, statusSource?: PresenceSource, statusExpiresAt?: Date]
	): void {
		emit(uid, [args]);
		return this.streamPresence.emitWithoutBroadcast(uid, args);
	}

	progressUpdated(progress: { rate: number } | IImportProgress): void {
		this.streamImporters.emit('progress', progress);
	}

	notifyVideoConferenceUpdatedInThisInstance(callId: string): void {
		this.streamVideoConference.emitWithoutBroadcast(`${callId}/updated`);
	}
}

type ExtractNotifyUserEventName<
	T extends StreamNames,
	P extends string,
	E extends StreamKeys<T> = StreamKeys<T>,
> = E extends `${infer X}/${infer I}` ? (P extends X ? I : never) : never;
