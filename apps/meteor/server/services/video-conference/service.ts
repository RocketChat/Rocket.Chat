import { Apps } from '@rocket.chat/apps';
import type { AppVideoConfProviderManager } from '@rocket.chat/apps/dist/server/managers/AppVideoConfProviderManager';
import type { VideoConfData, VideoConfDataExtended } from '@rocket.chat/apps-engine/definition/videoConfProviders';
import type { IVideoConfService, VideoConferenceJoinOptions } from '@rocket.chat/core-services';
import { api, ServiceClassInternal, Message, Room } from '@rocket.chat/core-services';
import type {
	IDirectVideoConference,
	ILivechatVideoConference,
	IRoom,
	IUser,
	VideoConferenceInstructions,
	DirectCallInstructions,
	ConferenceInstructions,
	LivechatInstructions,
	AtLeast,
	IGroupVideoConference,
	IVideoConferenceUser,
	IMessage,
	IStats,
	VideoConference,
	VideoConferenceCapabilities,
	VideoConferenceChatAccess,
	VideoConferenceChatAccessMode,
	VideoConferenceCreateData,
	VideoConferenceWithDiscussion,
	Optional,
	ExternalVideoConference,
	IVoIPVideoConference,
} from '@rocket.chat/core-typings';
import {
	VideoConferenceStatus,
	hasJoinedVideoConference,
	isDirectVideoConference,
	isGroupVideoConference,
	isLivechatVideoConference,
} from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { CallHistory, Users, VideoConference as VideoConferenceModel, Rooms, Messages, Subscriptions } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import { wrapExceptions } from '@rocket.chat/tools';
import type * as UiKit from '@rocket.chat/ui-kit';
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';

import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';
import { buildConferenceCallHistoryItems } from '../../../lib/videoConference/callHistory';
import { resolveChatAccessMode } from '../../../lib/videoConference/chatAccess';
import { availabilityErrors, shouldRingVideoConference } from '../../../lib/videoConference/constants';
import { readSecondaryPreferred } from '../../database/readSecondaryPreferred';
import { canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';
import { callbacks } from '../../lib/callbacks';
import { i18n } from '../../lib/i18n';
import { isRoomCompatibleWithVideoConfRinging } from '../../lib/isRoomCompatibleWithVideoConfRinging';
import { RocketChatAssets } from '../../lib/media/assets';
import { sendMessage } from '../../lib/messages/sendMessage';
import { metrics } from '../../lib/metrics/lib/metrics';
import { Push } from '../../lib/notifications/push/push';
import PushNotification from '../../lib/notifications/push-config/lib/PushNotification';
import { notifyOnMessageChange } from '../../lib/notifyListener';
import { createRoom } from '../../lib/rooms/createRoom';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { updateCounter } from '../../lib/statistics/functions/updateStatsCounter';
import { getUserAvatarURL } from '../../lib/utils/getUserAvatarURL';
import { getUserPreference } from '../../lib/utils/lib/getUserPreference';
import { videoConfProviders } from '../../lib/videoConfProviders';
import { videoConfTypes } from '../../lib/videoConfTypes';
import { addUsersToRoomMethod } from '../../meteor-methods/rooms/addUsersToRoom';
import { settings } from '../../settings';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

const logger = new Logger('VideoConference');

export class VideoConfService extends ServiceClassInternal implements IVideoConfService {
	protected name = 'video-conference';

	// VideoConference.create: Start a video conference using the type and provider specified as arguments
	public async create(
		{ type, rid, createdBy, providerName, ...data }: VideoConferenceCreateData,
		useAppUser = true,
	): Promise<VideoConferenceInstructions> {
		return wrapExceptions(async () => {
			const room = await Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'uids' | 'name' | 'fname'>>(rid, {
				projection: { t: 1, uids: 1, name: 1, fname: 1 },
			});

			if (!room) {
				throw new Error('invalid-room');
			}

			const user = await Users.findOneById<IUser>(createdBy);
			if (!user) {
				throw new Error('failed-to-load-own-data');
			}

			if (type === 'direct') {
				if (!isRoomCompatibleWithVideoConfRinging(room.t, room.uids)) {
					throw new Error('type-and-room-not-compatible');
				}

				return this.startDirect(providerName, user, room, data);
			}

			if (type === 'livechat') {
				return this.startLivechat(providerName, user, rid);
			}

			const title = (data as Partial<IGroupVideoConference>).title || room.fname || room.name || '';
			return this.startGroup(providerName, user, room._id, title, data, useAppUser);
		}).catch((err) => {
			logger.error({
				name: 'Error on VideoConf.create',
				err,
			});
			throw err;
		});
	}

	// VideoConference.start: Detect the desired type and provider then start a video conference using them
	public async start(
		caller: IUser['_id'],
		rid: string,
		{ title, allowRinging }: { title?: string; allowRinging?: boolean },
	): Promise<VideoConferenceInstructions> {
		return wrapExceptions(async () => {
			const providerName = await this.getValidatedProvider();
			const initialData = await this.getTypeForNewVideoConference(rid, Boolean(allowRinging));

			const data = {
				...initialData,
				createdBy: caller,
				rid,
				providerName,
			};

			if (data.type === 'videoconference') {
				data.title = title;
			}

			return this.create(data, false);
		}).catch((err) => {
			logger.error({
				name: 'Error on VideoConf.start',
				err,
			});
			throw err;
		});
	}

	public async join(uid: IUser['_id'] | undefined, callId: VideoConference['_id'], options: VideoConferenceJoinOptions): Promise<string> {
		return wrapExceptions(async () => {
			const call = await VideoConferenceModel.findOneById(callId);
			if (!call || call.endedAt || !videoConfTypes.isCallManagedByApp(call)) {
				throw new Error('invalid-call');
			}

			let user: Pick<IUser, '_id' | 'username' | 'name' | 'avatarETag'> | null = null;

			if (uid) {
				user = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name' | 'avatarETag'>>(uid, {
					projection: { name: 1, username: 1, avatarETag: 1 },
				});
				if (!user) {
					throw new Error('failed-to-load-own-data');
				}
			}

			if (call.providerName === 'jitsi') {
				updateCounter({ settingsId: 'Jitsi_Click_To_Join_Count' });
			}

			return this.joinCall(call, user || undefined, options);
		}).catch((err) => {
			logger.error({
				name: 'Error on VideoConf.join',
				err,
			});
			throw err;
		});
	}

	public async getInfo(callId: VideoConference['_id'], uid: IUser['_id'] | undefined): Promise<UiKit.ModalSurfaceLayout> {
		const call = await VideoConferenceModel.findOneById(callId);
		if (!call) {
			throw new Error('invalid-call');
		}

		if (!videoConfTypes.isCallManagedByApp(call)) {
			return [];
		}

		if (!videoConfProviders.isProviderAvailable(call.providerName)) {
			throw new Error('video-conf-provider-unavailable');
		}

		let user: Pick<Required<IUser>, '_id' | 'username' | 'name' | 'avatarETag'> | null = null;

		if (uid) {
			user = await Users.findOneById<Pick<Required<IUser>, '_id' | 'username' | 'name' | 'avatarETag'>>(uid, {
				projection: { name: 1, username: 1, avatarETag: 1 },
			});
			if (!user) {
				throw new Error('failed-to-load-own-data');
			}
		}

		const blocks = await (await this.getProviderManager()).getVideoConferenceInfo(call.providerName, call, user || undefined).catch((e) => {
			throw new Error(e);
		});

		if (blocks?.length) {
			return blocks as UiKit.ModalSurfaceLayout;
		}

		return [
			{
				blockId: 'videoconf-info',
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `**${i18n.t('Video_Conference_Url')}**: ${call.url}`,
				},
			},
		];
	}

	public async cancel(uid: IUser['_id'], callId: VideoConference['_id']): Promise<void> {
		const call = await VideoConferenceModel.findOneById(callId);
		if (!call || !isDirectVideoConference(call)) {
			throw new Error('invalid-call');
		}

		if (call.status !== VideoConferenceStatus.CALLING || call.endedBy || call.endedAt) {
			throw new Error('invalid-call-status');
		}

		const user = await Users.findOneById(uid);
		if (!user) {
			throw new Error('failed-to-load-own-data');
		}

		await VideoConferenceModel.setDataById(callId, {
			ringing: false,
			status: VideoConferenceStatus.DECLINED,
			endedAt: new Date(),
			endedBy: {
				_id: user._id,
				name: user.name as string,
				username: user.username as string,
			},
		});

		await this.runVideoConferenceChangedEvent(callId);
		this.notifyVideoConfUpdate(call.rid, call._id);

		await this.sendAllPushNotifications(call._id);
	}

	public async get(callId: VideoConference['_id']): Promise<Omit<VideoConference, 'providerData'> | null> {
		return VideoConferenceModel.findOneById<Omit<VideoConference, 'providerData'>>(callId, { projection: { providerData: 0 } });
	}

	public async getUnfiltered(callId: VideoConference['_id']): Promise<VideoConference | null> {
		return VideoConferenceModel.findOneById(callId);
	}

	public async list(
		roomId: IRoom['_id'],
		pagination: { offset?: number; count?: number } = {},
	): Promise<PaginatedResult<{ data: VideoConferenceWithDiscussion[] }>> {
		const { cursor, totalCount } = VideoConferenceModel.findPaginatedByRoomId(roomId, pagination);

		const [data, total] = await Promise.all([cursor.toArray(), totalCount]);

		return {
			data,
			offset: pagination.offset || 0,
			count: data.length,
			total,
		};
	}

	public async setProviderData(callId: VideoConference['_id'], data: VideoConference['providerData'] | undefined): Promise<void> {
		await VideoConferenceModel.setProviderDataById(callId, data);
	}

	public async setEndedBy(callId: VideoConference['_id'], endedBy: IUser['_id']): Promise<void> {
		const user = await Users.findOneById<Required<Pick<IUser, '_id' | 'username' | 'name'>>>(endedBy, {
			projection: { username: 1, name: 1 },
		});
		if (!user) {
			throw new Error('Invalid User');
		}

		await VideoConferenceModel.setEndedById(callId, {
			_id: user._id,
			username: user.username,
			name: user.name,
		});
	}

	public async setEndedAt(callId: VideoConference['_id'], endedAt: Date): Promise<void> {
		await VideoConferenceModel.setEndedById(callId, undefined, endedAt);
	}

	public async setStatus(callId: VideoConference['_id'], status: VideoConference['status']): Promise<void> {
		switch (status) {
			case VideoConferenceStatus.ENDED:
				return this.endCall(callId);
			case VideoConferenceStatus.EXPIRED:
				return this.expireCall(callId);
		}

		await VideoConferenceModel.setStatusById(callId, status);
	}

	public async addUser(callId: VideoConference['_id'], userId?: IUser['_id'], ts?: Date): Promise<void> {
		const call = await this.get(callId);
		if (!call) {
			throw new Error('Invalid video conference');
		}

		if (!userId) {
			if (call.type === 'videoconference') {
				return this.addAnonymousUser(call as Omit<IGroupVideoConference, 'providerData'>);
			}

			throw new Error('Invalid User');
		}

		const user = await Users.findOneById<Required<Pick<IUser, '_id' | 'username' | 'name' | 'avatarETag'>>>(userId, {
			projection: { username: 1, name: 1, avatarETag: 1 },
		});
		if (!user) {
			throw new Error('Invalid User');
		}

		await this.addUserToCall(call, {
			_id: user._id,
			username: user.username,
			name: user.name,
			avatarETag: user.avatarETag,
			ts: ts || new Date(),
		});
	}

	public async listProviders(): Promise<{ key: string; label: string }[]> {
		return videoConfProviders.getProviderList();
	}

	public async listProviderCapabilities(providerName: string): Promise<VideoConferenceCapabilities> {
		return videoConfProviders.getProviderCapabilities(providerName) || {};
	}

	public async listCapabilities(): Promise<{ providerName: string; capabilities: VideoConferenceCapabilities }> {
		const providerName = await this.getValidatedProvider();

		return {
			providerName,
			capabilities: videoConfProviders.getProviderCapabilities(providerName) || {},
		};
	}

	public async declineLivechatCall(callId: VideoConference['_id']): Promise<boolean> {
		const call = await this.getUnfiltered(callId);

		if (!isLivechatVideoConference(call)) {
			return false;
		}

		if (call.messages.started) {
			const name =
				(settings.get<boolean>('UI_Use_Real_Name') ? call.createdBy.name : call.createdBy.username) || call.createdBy.username || '';
			const text = i18n.t('video_livechat_missed', { username: name });
			await Messages.setBlocksById(call.messages.started, [this.buildMessageBlock(text)]);

			await notifyOnMessageChange({
				id: call.messages.started,
			});
		}

		await VideoConferenceModel.setDataById(call._id, {
			status: VideoConferenceStatus.DECLINED,
			endedAt: new Date(),
		});

		return true;
	}

	public async diagnoseProvider(uid: string, rid: string, providerName?: string): Promise<string | undefined> {
		try {
			if (providerName) {
				await this.validateProvider(providerName);
			} else {
				await this.getValidatedProvider();
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				await this.createEphemeralMessage(uid, rid, error.message);
				return error.message;
			}
		}
	}

	public async getStatistics(): Promise<IStats['videoConf']> {
		const options = {
			readPreference: readSecondaryPreferred(db),
		};

		const [videoConferenceStarted, videoConferenceEnded, directCalling, directStarted, directEnded, livechatStarted, livechatEnded] =
			await Promise.all([
				VideoConferenceModel.countByTypeAndStatus('videoconference', VideoConferenceStatus.STARTED, options),
				VideoConferenceModel.countByTypeAndStatus('videoconference', VideoConferenceStatus.ENDED, options),
				VideoConferenceModel.countByTypeAndStatus('direct', VideoConferenceStatus.CALLING, options),
				VideoConferenceModel.countByTypeAndStatus('direct', VideoConferenceStatus.STARTED, options),
				VideoConferenceModel.countByTypeAndStatus('direct', VideoConferenceStatus.ENDED, options),
				VideoConferenceModel.countByTypeAndStatus('livechat', VideoConferenceStatus.STARTED, options),
				VideoConferenceModel.countByTypeAndStatus('livechat', VideoConferenceStatus.ENDED, options),
			]);

		return {
			videoConference: {
				started: videoConferenceStarted,
				ended: videoConferenceEnded,
			},
			direct: {
				calling: directCalling,
				started: directStarted,
				ended: directEnded,
			},
			livechat: {
				started: livechatStarted,
				ended: livechatEnded,
			},
			settings: {
				provider: settings.get<string>('VideoConf_Default_Provider'),
				dms: settings.get<boolean>('VideoConf_Enable_DMs'),
				channels: settings.get<boolean>('VideoConf_Enable_Channels'),
				groups: settings.get<boolean>('VideoConf_Enable_Groups'),
				teams: settings.get<boolean>('VideoConf_Enable_Teams'),
			},
		};
	}

	public async validateAction(
		action: string,
		caller: IUser['_id'],
		{ callId, uid, rid }: { callId: VideoConference['_id']; uid: IUser['_id']; rid: IRoom['_id'] },
	): Promise<boolean> {
		if (!callId || !uid || !rid) {
			return false;
		}

		if (!(await canAccessRoomIdAsync(rid, caller)) || (caller !== uid && !(await canAccessRoomIdAsync(rid, uid)))) {
			return false;
		}

		const call = await VideoConferenceModel.findOneById<Pick<VideoConference, '_id' | 'status' | 'endedAt' | 'createdBy'>>(callId, {
			projection: { status: 1, endedAt: 1, createdBy: 1 },
		});

		if (!call) {
			return false;
		}

		if (action === 'end') {
			return true;
		}

		if (call.endedAt || call.status > VideoConferenceStatus.STARTED) {
			// If the caller is still calling about a call that has already ended, notify it
			if (action === 'call' && caller === call.createdBy._id) {
				this.notifyUser(call.createdBy._id, 'end', { rid, uid, callId });
			}

			return false;
		}

		return true;
	}

	public async createVoIP(data: InsertionModel<IVoIPVideoConference>): Promise<IVoIPVideoConference['_id'] | undefined> {
		return wrapExceptions(async () => VideoConferenceModel.createVoIP(data)).catch((err) => {
			logger.error({
				name: 'Error on VideoConf.createVoIP',
				err,
			});
			throw err;
		});
	}

	private notifyUser(
		userId: IUser['_id'],
		action: string,
		params: { uid: IUser['_id']; rid: IRoom['_id']; callId: VideoConference['_id'] },
	): void {
		void api.broadcast('user.video-conference', { userId, action, params });
	}

	private notifyVideoConfUpdate(rid: IRoom['_id'], callId: VideoConference['_id']): void {
		void api.broadcast('room.video-conference', { rid, callId });
	}

	private async endCall(callId: VideoConference['_id']): Promise<void> {
		const call = await this.getUnfiltered(callId);
		if (!call) {
			return;
		}

		await VideoConferenceModel.setDataById(call._id, { endedAt: new Date(), status: VideoConferenceStatus.ENDED });
		await this.runVideoConferenceChangedEvent(call._id);
		this.notifyVideoConfUpdate(call.rid, call._id);

		// `setStatus(ENDED)` is public and reachable more than once for the same call (an app provider can send
		// it repeatedly), so only write history the first time — otherwise every member collects a duplicate
		// entry. `call` was read before `endedAt` was set above, so it still shows the previous state.
		if (isGroupVideoConference(call) && !call.endedAt) {
			await this.saveConferenceToHistory(call);
		}

		if (call.type === 'direct') {
			return this.endDirectCall(call);
		}
	}

	// Writes one call-history item per conference member (see `buildConferenceCallHistoryItems`), so a group
	// conference gets a "rejoin from a past call" entry point the same way media calls do. Direct and livechat
	// conferences are out of scope: they have no `title` and aren't the many-participants case this covers.
	private async saveConferenceToHistory(call: IGroupVideoConference): Promise<void> {
		if (!call.users.length) {
			return;
		}

		await CallHistory.insertMany(buildConferenceCallHistoryItems(call)).catch((err: unknown) =>
			logger.error({ msg: 'Failed to insert items into Call History', err, callId: call._id }),
		);
	}

	private async expireCall(callId: VideoConference['_id']): Promise<void> {
		const call = await VideoConferenceModel.findOneById<Pick<VideoConference, '_id' | 'messages'>>(callId, { projection: { messages: 1 } });
		if (!call) {
			return;
		}

		await VideoConferenceModel.setDataById(call._id, { endedAt: new Date(), status: VideoConferenceStatus.EXPIRED });
	}

	private async endDirectCall(call: IDirectVideoConference): Promise<void> {
		const params = { rid: call.rid, uid: call.createdBy._id, callId: call._id };

		// Notify the caller that the call was ended by the server
		this.notifyUser(call.createdBy._id, 'end', params);

		// If the callee hasn't joined the call yet, notify them that it has already ended
		const subscriptions = await Subscriptions.findByRoomIdAndNotUserId(call.rid, call.createdBy._id, {
			projection: { 'u._id': 1, '_id': 0 },
		}).toArray();

		for (const subscription of subscriptions) {
			// Skip notifying users that already joined the call
			if (call.users.find(({ _id }) => _id === subscription.u._id)) {
				continue;
			}

			this.notifyUser(subscription.u._id, 'end', params);
		}
	}

	private async getTypeForNewVideoConference(
		rid: IRoom['_id'],
		allowRinging: boolean,
	): Promise<AtLeast<VideoConferenceCreateData, 'type'>> {
		const room = await Rooms.findOneById<Pick<IRoom, '_id' | 't'>>(rid, {
			projection: { t: 1 },
		});

		if (!room) {
			throw new Error('invalid-room');
		}

		return videoConfTypes.getTypeForRoom(room, allowRinging);
	}

	private async createMessage(call: VideoConference, createdBy?: IUser, customBlocks?: IMessage['blocks']): Promise<IMessage['_id']> {
		const record = {
			t: 'videoconf',
			msg: '',
			groupable: false,
			blocks: customBlocks || [this.buildVideoConfBlock(call._id)],
		} satisfies Partial<IMessage>;

		const room = await Rooms.findOneById(call.rid);
		const appId = videoConfProviders.getProviderAppId(call.providerName);
		const user = createdBy || (appId && (await Users.findOneByAppId(appId))) || (await Users.findOneById('rocket.cat'));

		const message = await sendMessage(user, record, room);

		if (!message) {
			throw new Error('failed-to-create-message');
		}

		return message._id;
	}

	private async validateProvider(providerName: string): Promise<void> {
		const manager = await this.getProviderManager();
		const configured = await manager.isFullyConfigured(providerName).catch(() => false);
		if (!configured) {
			throw new Error(availabilityErrors.NOT_CONFIGURED);
		}
	}

	private async getValidatedProvider(): Promise<string> {
		if (!videoConfProviders.hasAnyProvider()) {
			throw new Error(availabilityErrors.NO_APP);
		}

		const providerName = videoConfProviders.getActiveProvider();
		if (!providerName) {
			throw new Error(availabilityErrors.NOT_ACTIVE);
		}

		await this.validateProvider(providerName);

		return providerName;
	}

	private async createEphemeralMessage(uid: string, rid: string, i18nKey: string): Promise<void> {
		const user = await Users.findOneById<Pick<IUser, 'language' | 'roles'>>(uid, { projection: { language: 1, roles: 1 } });
		const language = user?.language || settings.get<string>('Language') || 'en';
		const key = user?.roles.includes('admin') ? `admin-${i18nKey}` : i18nKey;
		const msg = i18n.t(key, {
			lng: language,
		});

		void api.broadcast('notify.ephemeralMessage', uid, rid, {
			msg,
		});
	}

	private async createLivechatMessage(call: ILivechatVideoConference, user: IUser, url: string): Promise<IMessage['_id']> {
		const username = (settings.get<boolean>('UI_Use_Real_Name') ? user.name : user.username) || user.username || '';
		const text = i18n.t('video_livechat_started', {
			username,
		});

		return this.createMessage(call, user, [
			this.buildMessageBlock(text),
			{
				type: 'actions',
				appId: 'videoconf-core',
				blockId: call._id,
				elements: [
					{
						appId: 'videoconf-core',
						blockId: call._id,
						actionId: 'joinLivechat',
						type: 'button',
						text: {
							type: 'plain_text',
							text: i18n.t('Join_call'),
							emoji: true,
						},
						url,
					},
				],
			},
		]);
	}

	private buildVideoConfBlock(callId: string): UiKit.MessageSurfaceLayout[number] {
		return {
			type: 'video_conf',
			blockId: callId,
			callId,
			appId: 'videoconf-core',
		};
	}

	private buildMessageBlock(text: string): UiKit.MessageSurfaceLayout[number] {
		return {
			type: 'section',
			appId: 'videoconf-core',
			text: {
				type: 'mrkdwn',
				text: `${text}`,
			},
		};
	}

	private async sendPushNotification(
		call: AtLeast<IDirectVideoConference, 'createdBy' | 'rid' | '_id' | 'status'>,
		calleeId: IUser['_id'],
	): Promise<void> {
		if (
			settings.get('Push_enable') !== true ||
			settings.get('VideoConf_Mobile_Ringing') !== true ||
			!(await getUserPreference(calleeId, 'enableMobileRinging'))
		) {
			return;
		}

		await Push.send({
			from: 'push',
			badge: 0,
			sound: 'ringtone.mp3',
			priority: 10,
			title: `@${call.createdBy.username}`,
			text: i18n.t('Video_Conference'),
			payload: {
				host: Meteor.absoluteUrl(),
				rid: call.rid,
				notificationType: 'videoconf',
				caller: call.createdBy,
				avatar: getUserAvatarURL(call.createdBy.username),
				status: call.status,
				callId: call._id,
			},
			userId: calleeId,
			notId: PushNotification.getNotificationId(`${call.rid}|${call._id}`),
			gcm: {
				style: 'inbox',
				image: RocketChatAssets.getURL('Assets_favicon_192'),
			},
			apn: {
				category: 'VIDEOCONF',
			},
		});

		metrics.notificationsSent.inc({ notification_type: 'mobile' });
		metrics.notificationsSentTotal.inc({ notification_type: 'mobile' });
	}

	private async sendAllPushNotifications(callId: VideoConference['_id']): Promise<void> {
		if (settings.get('Push_enable') !== true || settings.get('VideoConf_Mobile_Ringing') !== true) {
			return;
		}

		const call = await VideoConferenceModel.findOneById<Pick<VideoConference, 'createdBy' | 'rid' | '_id' | 'users' | 'status'>>(callId, {
			projection: { createdBy: 1, rid: 1, users: 1, status: 1 },
		});

		if (!call) {
			return;
		}

		const subscriptions = Subscriptions.findByRoomIdAndNotUserId(call.rid, call.createdBy._id, {
			projection: { 'u._id': 1, '_id': 0 },
		});

		for await (const subscription of subscriptions) {
			await this.sendPushNotification(call, subscription.u._id);
		}
	}

	private async startDirect(
		providerName: string,
		user: IUser,
		{ _id: rid, uids }: AtLeast<IRoom, '_id' | 'uids'>,
		extraData?: Partial<IDirectVideoConference>,
	): Promise<DirectCallInstructions> {
		const calleeId = uids?.filter((uid) => uid !== user._id).pop();
		if (!calleeId) {
			// Are you trying to call yourself?
			throw new Error('invalid-call-target');
		}

		const callId = await VideoConferenceModel.createDirect({
			...extraData,
			rid,
			createdBy: {
				_id: user._id,
				name: user.name as string,
				username: user.username as string,
			},
			providerName,
		});

		await this.runNewVideoConferenceEvent(callId);

		await this.maybeCreateDiscussion(callId, user);

		const call = (await this.getUnfiltered(callId)) as IDirectVideoConference | null;
		if (!call) {
			throw new Error('failed-to-create-direct-call');
		}
		const url = await this.generateNewUrl(call);
		await VideoConferenceModel.setUrlById(callId, url);

		const messageId = await this.createMessage(call, user);
		call.messages.started = messageId;
		await VideoConferenceModel.setMessageById(callId, 'started', messageId);

		// After 40 seconds if the status is still "calling", we cancel the call automatically.
		setTimeout(async () => {
			try {
				const call = await VideoConferenceModel.findOneById<IDirectVideoConference>(callId);

				if (call) {
					await this.endDirectCall(call);
					if (call.status !== VideoConferenceStatus.CALLING) {
						return;
					}

					await this.cancel(user._id, callId);
				}
			} catch {
				// Ignore errors on this timeout
			}
		}, 40000);

		await this.sendPushNotification(call, calleeId);

		return {
			type: 'direct',
			callId,
			calleeId,
		};
	}

	private async notifyUsersOfRoom(
		rid: IRoom['_id'],
		uid: IUser['_id'],
		action: string,
		params: { uid: IUser['_id']; rid: IRoom['_id']; callId: VideoConference['_id'] },
	): Promise<void> {
		const subscriptions = Subscriptions.findByRoomIdAndNotUserId(rid, uid, {
			projection: { 'u._id': 1, '_id': 0 },
		});

		await subscriptions.forEach((subscription) => this.notifyUser(subscription.u._id, action, params));
	}

	private async startGroup(
		providerName: string,
		user: IUser,
		rid: IRoom['_id'],
		title: string,
		extraData?: Partial<IGroupVideoConference>,
		useAppUser = true,
	): Promise<ConferenceInstructions> {
		const callId = await VideoConferenceModel.createGroup({
			...extraData,
			rid,
			title,
			createdBy: {
				_id: user._id,
				name: user.name as string,
				username: user.username as string,
			},
			providerName,
		});

		await this.runNewVideoConferenceEvent(callId);

		await this.maybeCreateDiscussion(callId, user);

		const call = (await this.getUnfiltered(callId)) as IGroupVideoConference | null;
		if (!call) {
			throw new Error('failed-to-create-group-call');
		}

		const url = await this.generateNewUrl(call);
		await VideoConferenceModel.setUrlById(callId, url);

		call.url = url;

		const messageId = await this.createMessage(call, useAppUser ? undefined : user);
		call.messages.started = messageId;
		await VideoConferenceModel.setMessageById(callId, 'started', messageId);

		if (call.ringing) {
			await this.notifyUsersOfRoom(rid, user._id, 'ring', { callId, rid, uid: call.createdBy._id });
		}

		return {
			type: 'videoconference',
			callId,
			rid,
		};
	}

	private async startLivechat(providerName: string, user: IUser, rid: IRoom['_id']): Promise<LivechatInstructions> {
		const callId = await VideoConferenceModel.createLivechat({
			rid,
			createdBy: {
				_id: user._id,
				name: user.name as string,
				username: user.username as string,
			},
			providerName,
		});

		const call = (await this.getUnfiltered(callId)) as ILivechatVideoConference | null;
		if (!call) {
			throw new Error('failed-to-create-livechat-call');
		}

		await this.runNewVideoConferenceEvent(callId);

		// Livechat conferences do not use discussions

		const joinUrl = await this.getUrl(call);
		const messageId = await this.createLivechatMessage(call, user, joinUrl);
		call.messages.started = messageId;
		await VideoConferenceModel.setMessageById(callId, 'started', messageId);

		return {
			type: 'livechat',
			callId,
		};
	}

	private async joinCall(
		call: ExternalVideoConference,
		user: AtLeast<IUser, '_id' | 'username' | 'name' | 'avatarETag'> | undefined,
		options: VideoConferenceJoinOptions,
	): Promise<string> {
		void callbacks.runAsync('onJoinVideoConference', call._id, user?._id);

		await this.runOnUserJoinEvent(call._id, user as IVideoConferenceUser);

		return this.getUrl(call, user, options);
	}

	private async getProviderManager(): Promise<AppVideoConfProviderManager> {
		if (!Apps.self?.isLoaded()) {
			throw new Error('apps-engine-not-loaded');
		}

		const manager = Apps.self?.getManager()?.getVideoConfProviderManager();
		if (!manager) {
			throw new Error(availabilityErrors.NO_APP);
		}

		return manager;
	}

	private async getRoomName(rid: string): Promise<string> {
		const room = await Rooms.findOneById<Pick<IRoom, '_id' | 'name' | 'fname'>>(rid, { projection: { name: 1, fname: 1 } });

		return room?.fname || room?.name || rid;
	}

	private async generateNewUrl(call: ExternalVideoConference): Promise<string> {
		if (!videoConfProviders.isProviderAvailable(call.providerName)) {
			throw new Error('video-conf-provider-unavailable');
		}

		const title = isGroupVideoConference(call) ? call.title || (await this.getRoomName(call.rid)) : '';
		const callData: VideoConfData = {
			_id: call._id,
			type: call.type,
			rid: call.rid,
			createdBy: call.createdBy,
			title,
			providerData: call.providerData,
			discussionRid: call.discussionRid,
		};

		return (await this.getProviderManager()).generateUrl(call.providerName, callData);
	}

	private async getCallTitleForUser(call: VideoConference, userId?: IUser['_id']): Promise<string> {
		if (call.type === 'videoconference' && call.title) {
			return call.title;
		}

		if (userId) {
			const subscription = await Subscriptions.findOneByRoomIdAndUserId(call.rid, userId, { projection: { fname: 1, name: 1 } });
			if (subscription) {
				return subscription.fname || subscription.name;
			}
		}

		const room = await Rooms.findOneById(call.rid);
		return room?.fname || room?.name || 'Rocket.Chat';
	}

	private async getCallTitle(call: VideoConference): Promise<string> {
		if (call.type === 'videoconference') {
			if (call.title) {
				return call.title;
			}
		}

		const room = await Rooms.findOneById(call.rid);
		if (room) {
			if (room.t === 'd') {
				if (room.usernames?.length) {
					return room.usernames.join(', ');
				}
			} else if (room.fname) {
				return room.fname;
			} else if (room.name) {
				return room.name;
			}
		}

		return 'Rocket.Chat';
	}

	private async getUrl(
		call: ExternalVideoConference,
		user?: AtLeast<IUser, '_id' | 'username' | 'name'>,
		options: VideoConferenceJoinOptions = {},
	): Promise<string> {
		if (!videoConfProviders.isProviderAvailable(call.providerName)) {
			throw new Error('video-conf-provider-unavailable');
		}

		if (!call.url) {
			call.url = await this.generateNewUrl(call);
			await VideoConferenceModel.setUrlById(call._id, call.url);
		}

		const callData: VideoConfDataExtended = {
			_id: call._id,
			type: call.type,
			rid: call.rid,
			url: call.url,
			createdBy: call.createdBy,
			providerData: {
				...(call.providerData || {}),
				...{ customCallTitle: await this.getCallTitleForUser(call, user?._id) },
			},
			title: await this.getCallTitle(call),
			discussionRid: call.discussionRid,
		};

		const userData = user && {
			_id: user._id,
			username: user.username as string,
			name: user.name as string,
		};

		return (await this.getProviderManager()).customizeUrl(call.providerName, callData, userData, options);
	}

	private async runNewVideoConferenceEvent(callId: VideoConference['_id']): Promise<void> {
		const call = await VideoConferenceModel.findOneById(callId);

		if (!call) {
			throw new Error('video-conf-data-not-found');
		}

		if (!videoConfTypes.isCallManagedByApp(call)) {
			return;
		}

		if (!videoConfProviders.isProviderAvailable(call.providerName)) {
			throw new Error('video-conf-provider-unavailable');
		}

		return (await this.getProviderManager()).onNewVideoConference(call.providerName, call);
	}

	private async runVideoConferenceChangedEvent(callId: VideoConference['_id']): Promise<void> {
		const call = await VideoConferenceModel.findOneById(callId);

		if (!call) {
			throw new Error('video-conf-data-not-found');
		}

		if (!videoConfTypes.isCallManagedByApp(call)) {
			return;
		}

		if (!videoConfProviders.isProviderAvailable(call.providerName)) {
			throw new Error('video-conf-provider-unavailable');
		}

		return (await this.getProviderManager()).onVideoConferenceChanged(call.providerName, call);
	}

	private async runOnUserJoinEvent(callId: VideoConference['_id'], user?: IVideoConferenceUser): Promise<void> {
		const call = await VideoConferenceModel.findOneById(callId);

		if (!call) {
			throw new Error('video-conf-data-not-found');
		}

		if (!videoConfTypes.isCallManagedByApp(call)) {
			return;
		}

		if (!videoConfProviders.isProviderAvailable(call.providerName)) {
			throw new Error('video-conf-provider-unavailable');
		}

		return (await this.getProviderManager()).onUserJoin(call.providerName, call, user);
	}

	private async addUserToCall(
		call: Optional<VideoConference, 'providerData'>,
		{ _id, username, name, avatarETag, ts }: AtLeast<Required<IUser>, '_id' | 'username' | 'name' | 'avatarETag'> & { ts?: Date },
	): Promise<void> {
		// If the call has a discussion, ensure the user is subscribed to it;
		// This is done even if the user has already joined the call before, so they can be added back if they had left the discussion.
		if (call.discussionRid) {
			await this.addUserToDiscussion(call.discussionRid, _id);
		}

		// Already in the call — nothing to record.
		const member = call.users.find((user) => user._id === _id);
		if (member && hasJoinedVideoConference(member)) {
			return;
		}

		// Both writes are idempotent, and both are needed: the first covers someone who wasn't a member yet
		// (it no-ops for an existing member), the second covers a member who had been added but hadn't joined.
		// Running both also closes the race where two joins land between the read above and the write.
		await VideoConferenceModel.addMemberById(call._id, { _id, username, name, avatarETag, ts, joined: true, joinedAt: ts });
		await VideoConferenceModel.setUserJoinedById(call._id, _id, ts);

		if (call.type === 'direct') {
			return this.updateDirectCall(call, _id);
		}

		this.notifyVideoConfUpdate(call.rid, call._id);
	}

	/**
	 * Registers users as members of the conference without touching any room. Membership is what authorizes
	 * joining the call, so this is how someone outside the conference's room gets in — reading the chat is a
	 * separate concern, surfaced in the UI rather than decided here.
	 */
	public async addMembers(
		uid: IUser['_id'],
		callId: VideoConference['_id'],
		usernames: NonNullable<IUser['username']>[],
	): Promise<IUser['_id'][]> {
		const call = await VideoConferenceModel.findOneById(callId, { projection: { rid: 1, users: 1 } });
		if (!call) {
			throw new Error('invalid-video-conference');
		}

		const users = await Users.find<Required<Pick<IUser, '_id' | 'username' | 'name' | 'avatarETag'>>>(
			{ username: { $in: usernames } },
			{ projection: { username: 1, name: 1, avatarETag: 1 } },
		).toArray();

		const added: IUser['_id'][] = [];
		const ts = new Date();

		for (const user of users) {
			// Already associated with the call — leave their entry (and any `joinedAt`) untouched.
			if (call.users.some(({ _id }) => _id === user._id)) {
				continue;
			}

			await VideoConferenceModel.addMemberById(callId, { ...user, ts, joined: false });
			added.push(user._id);
		}

		if (added.length) {
			this.notifyVideoConfUpdate(call.rid, callId);
		}

		// The list being rung is just the people added, and the endpoint caps a single add at the ringing
		// limit — so unlike starting a call in a large room, an add always rings.
		if (shouldRingVideoConference(added.length)) {
			added.forEach((memberId) => this.notifyUser(memberId, 'ring', { callId, rid: call.rid, uid }));

			// The ring only reaches a client that is on screen, and it is one-shot. A desktop notification is
			// what reaches someone who isn't looking at the app.
			await this.notifyUsersAddedToConference(uid, added, callId, call.rid);
		}

		return added;
	}

	/**
	 * Records that a user dismissed the call instead of joining.
	 *
	 * This only writes to the member's entry — it never ends the conference, which is what separates
	 * declining a conference from rejecting a 1:1 call. A member who declines can still join afterwards.
	 *
	 * Someone rung as a room member has no entry yet, so one is created for them: without it there would be
	 * nowhere to record the decline.
	 */
	public async declineCall(uid: IUser['_id'], callId: VideoConference['_id']): Promise<void> {
		const call = await VideoConferenceModel.findOneById(callId, { projection: { rid: 1, users: 1 } });
		if (!call) {
			throw new Error('invalid-video-conference');
		}

		if (!call.users.some(({ _id }) => _id === uid)) {
			const user = await Users.findOneById<Required<Pick<IUser, '_id' | 'username' | 'name' | 'avatarETag'>>>(uid, {
				projection: { username: 1, name: 1, avatarETag: 1 },
			});
			if (!user) {
				throw new Error('invalid-user');
			}

			await VideoConferenceModel.addMemberById(callId, { ...user, joined: false });
		}

		await VideoConferenceModel.setUserDeclinedById(callId, uid);
		this.notifyVideoConfUpdate(call.rid, callId);
	}

	/**
	 * Where the conference's chat lives and which members can't read it, because membership deliberately grants
	 * no room access. Surfacing them is the point: the choice of how to fix it is offered once it actually
	 * matters, rather than being forced on whoever adds a participant — so this also reports what that choice
	 * is, since it depends on the room and on who is asking.
	 *
	 * Access is asked per member rather than derived from subscriptions, because reading a room doesn't always
	 * require one — a public channel is readable by anyone, unless it belongs to a private team. Conferences
	 * are small, and getting a public-channel-in-a-private-team case wrong is worse than the extra reads.
	 */
	public async getChatAccess(uid: IUser['_id'], callId: VideoConference['_id']): Promise<VideoConferenceChatAccess> {
		const call = await VideoConferenceModel.findOneById(callId, { projection: { rid: 1, discussionRid: 1, users: 1 } });
		if (!call) {
			throw new Error('invalid-video-conference');
		}

		const rid = call.discussionRid || call.rid;
		const room = await Rooms.findOneById(rid);
		if (!room) {
			throw new Error('invalid-room');
		}

		const access = await Promise.all(call.users.map(async ({ _id }) => ({ _id, allowed: await canAccessRoomIdAsync(rid, _id) })));

		return {
			rid,
			name: room.fname || room.name || '',
			type: room.t,
			membersWithoutAccess: access.filter(({ allowed }) => !allowed).map(({ _id }) => _id),
			// Ask the room whether it can take new members rather than testing for a DM: the room type owns that
			// rule, and it accounts for cases a `t === 'd'` check would miss, like a federated DM that *can* grow.
			canInvite: await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.INVITE, uid),
		};
	}

	/**
	 * Gives every member who can't read the chat access to it, either by bringing them into the room — which
	 * exposes its whole history — or by moving the chat to a discussion. Both are lossy in different ways, so
	 * the caller chooses; without a choice, the room's own rules decide. Returns the room the chat now lives in.
	 */
	public async shareChatWithMembers(
		uid: IUser['_id'],
		callId: VideoConference['_id'],
		mode?: VideoConferenceChatAccessMode,
	): Promise<IRoom['_id']> {
		const { rid, membersWithoutAccess, canInvite, type } = await this.getChatAccess(uid, callId);
		if (!membersWithoutAccess.length) {
			return rid;
		}

		const resolved = resolveChatAccessMode({ mode, canInvite, type });
		if (!resolved) {
			throw new Error('error-not-allowed');
		}

		const call = await VideoConferenceModel.findOneById(callId, { projection: { users: 1 } });
		if (!call) {
			throw new Error('invalid-video-conference');
		}

		const withoutAccess = new Set(membersWithoutAccess);
		const usernames = call.users
			.filter(({ _id }) => withoutAccess.has(_id))
			.map(({ username }) => username)
			.filter((username): username is string => !!username);

		if (resolved === 'discussion') {
			// Moving the chat to a discussion broadcasts `discussionUpdated` on its own, which is what makes every
			// participant's panel follow the chat to its new room.
			return this.createConferenceDiscussionWithParticipants(uid, callId, usernames);
		}

		const invitedRid = await this.addUsersToConferenceRoom(uid, callId, usernames);

		// Inviting leaves the conference record untouched — only who can read the chat changed — so nothing else
		// tells the participants to look again. Without this their notice stays up until a reload.
		void api.broadcast('video-conference.chatAccessUpdated', { callId });

		return invitedRid;
	}

	private async addAnonymousUser(call: Optional<IGroupVideoConference, 'providerData'>): Promise<void> {
		await VideoConferenceModel.increaseAnonymousCount(call._id);
	}

	private async updateDirectCall(call: IDirectVideoConference, newUserId: IUser['_id']): Promise<void> {
		// If it's an user that hasn't joined yet — a member who was added but never joined still counts as not
		// having joined, so the ring must keep going for them.
		if (call.ringing && !call.users.some(({ _id, joined }) => _id === newUserId && hasJoinedVideoConference({ joined }))) {
			this.notifyUser(call.createdBy._id, 'join', { rid: call.rid, uid: newUserId, callId: call._id });
			if (newUserId !== call.createdBy._id) {
				this.notifyUser(newUserId, 'join', { rid: call.rid, uid: newUserId, callId: call._id });
				// If the callee joined the direct call, then we stopped ringing
				await VideoConferenceModel.setRingingById(call._id, false);
			}
		}

		if (call.status !== VideoConferenceStatus.CALLING) {
			return;
		}

		await VideoConferenceModel.setStatusById(call._id, VideoConferenceStatus.STARTED);
		this.notifyVideoConfUpdate(call.rid, call._id);

		await this.runVideoConferenceChangedEvent(call._id);
		await this.sendAllPushNotifications(call._id);
	}

	private isPersistentChatEnabled(): boolean {
		return settings.get<boolean>('VideoConf_Enable_Persistent_Chat') && settings.get<boolean>('Discussion_enabled');
	}

	private async maybeCreateDiscussion(callId: VideoConference['_id'], createdBy?: IUser): Promise<void> {
		if (!this.isPersistentChatEnabled()) {
			return;
		}

		const call = await VideoConferenceModel.findOneById(callId, {
			projection: { rid: 1, createdBy: 1, discussionRid: 1, providerName: 1 },
		});
		if (!call) {
			throw new Error('invalid-video-conference');
		}

		// If there's already a discussion assigned to it, do not create a new one
		if (call.discussionRid) {
			return;
		}

		// If the call provider does not explicitly support persistent chat, do not create discussions
		if (!videoConfProviders.getProviderCapabilities(call.providerName)?.persistentChat) {
			return;
		}

		await this.createDiscussionForConference(this.getDiscussionDisplayName(), call, createdBy);
	}

	private getDiscussionDisplayName(): string {
		const name = settings.get<string>('VideoConf_Persistent_Chat_Discussion_Name') || i18n.t('[date] Video Call Chat');
		const date = new Date().toISOString().substring(0, 10);

		return name.includes('[date]') ? name.replace('[date]', date) : `${date} ${name}`;
	}

	// Creates a discussion off the conference's room and points the conference's `discussionRid` at it so
	// the chat continues there without exposing the parent room's history to the new participants. For a
	// DM (which can't grow past two people) the discussion keeps the DM members; for other rooms it keeps
	// the room's current members. In both cases the newly selected users are added.
	public async createConferenceDiscussionWithParticipants(
		uid: IUser['_id'],
		callId: VideoConference['_id'],
		usernames: NonNullable<IUser['username']>[],
	): Promise<IRoom['_id']> {
		const [call, user] = await Promise.all([
			VideoConferenceModel.findOneById(callId, { projection: { rid: 1, discussionRid: 1 } }),
			Users.findOneById(uid),
		]);
		if (!call) {
			throw new Error('invalid-video-conference');
		}
		if (!user) {
			throw new Error('invalid-user');
		}

		// Build from the room the chat is *currently* in, not the room the call started in — otherwise a second
		// discussion would be derived from the original room and silently drop everyone added since the first
		// one. One read also covers the walk up to the top-level room: `prid` is only set for a discussion.
		const baseRoom = await Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'usernames' | 'prid' | 'teamId'>>(call.discussionRid || call.rid, {
			projection: { t: 1, usernames: 1, prid: 1, teamId: 1 },
		});
		if (!baseRoom) {
			throw new Error('invalid-room');
		}

		const parent = baseRoom.prid ? await this.getRoomForDiscussion(baseRoom.prid) : baseRoom;
		const type = await roomCoordinator.getRoomDirectives(parent.t).getDiscussionType(parent);
		if (!type) {
			throw new Error('error-invalid-discussion-type');
		}

		// Carry over the current participants so they keep the chat: DMs expose them on the room doc, while
		// channels/groups read them from the room's subscriptions (the conference's `users` list only holds
		// people who already joined the call, so it's not a good proxy for the room's members). The newly
		// selected users are added on top.
		const existingMembers =
			baseRoom.t === 'd'
				? baseRoom.usernames || []
				: (await Subscriptions.findByRoomIdWhenUsernameExists(baseRoom._id, { projection: { 'u.username': 1 } }).toArray())
						.map((subscription) => subscription.u.username)
						.filter((username): username is string => !!username);
		const members = [...new Set([...existingMembers, ...usernames])].filter(Boolean);

		const name = this.getDiscussionDisplayName();

		const discussion = await createRoom(
			type,
			Random.id(),
			user,
			members,
			false,
			false,
			{
				fname: name,
				prid: parent._id,
				encrypted: false,
			},
			{
				creator: user._id,
			},
		);

		// Leave a "discussion created" pointer in the parent room so its members can follow along.
		await Message.saveSystemMessage('discussion-created', parent._id, name, user, { drid: discussion._id });

		// The conference's `rid` always stays the original room; the chat to display is driven by
		// `discussionRid`. This sets it and broadcasts `discussionUpdated` so participants follow along.
		await this.assignDiscussionToConference(callId, discussion._id);

		// Let the newly invited users know with a desktop notification; clicking it opens the discussion.
		await this.notifyUsersInvitedToConference(user, usernames, callId, discussion);

		return discussion._id;
	}

	// Adds the users to the conference's active room, so they get its history — the counterpart to
	// `createConferenceDiscussionWithParticipants`.
	public async addUsersToConferenceRoom(
		uid: IUser['_id'],
		callId: VideoConference['_id'],
		usernames: NonNullable<IUser['username']>[],
	): Promise<IRoom['_id']> {
		const [call, user] = await Promise.all([
			VideoConferenceModel.findOneById(callId, { projection: { rid: 1, discussionRid: 1 } }),
			Users.findOneById(uid),
		]);
		if (!call) {
			throw new Error('invalid-video-conference');
		}
		if (!user) {
			throw new Error('invalid-user');
		}

		// The active conference room is the discussion when one was created, otherwise the original room.
		const rid = call.discussionRid || call.rid;

		const room = await Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'name' | 'fname'>>(rid, {
			projection: { t: 1, name: 1, fname: 1 },
		});
		if (!room) {
			throw new Error('invalid-room');
		}

		await addUsersToRoomMethod(uid, { rid, users: usernames }, user);

		// Let the added users know with a desktop notification; clicking it opens the room.
		await this.notifyUsersInvitedToConference(user, usernames, callId, room);

		return rid;
	}

	/**
	 * Tells the users just added to a conference that it is ringing for them, for the case where the in-product
	 * ring can't: a backgrounded tab, or no client open at all.
	 *
	 * Unlike `notifyUsersInvitedToConference` this carries **no room name**, which is what stops the click from
	 * navigating: membership grants no room access, so the room behind the call may be one they can't open.
	 * Clicking focuses the app, where the ring is; the "Join call" action joins the conference itself.
	 */
	private async notifyUsersAddedToConference(
		adderId: IUser['_id'],
		memberIds: IUser['_id'][],
		callId: VideoConference['_id'],
		rid: IRoom['_id'],
	): Promise<void> {
		const [adder, members] = await Promise.all([
			Users.findOneById<Pick<IUser, '_id' | 'username' | 'name'>>(adderId, { projection: { username: 1, name: 1 } }),
			Users.find<Pick<IUser, '_id' | 'language'>>({ _id: { $in: memberIds } }, { projection: { language: 1 } }).toArray(),
		]);

		if (!adder) {
			return;
		}

		for (const member of members) {
			const text = i18n.t('You_were_invited_to_a_conference', { lng: member.language });

			void api.broadcast('notify.desktop', member._id, {
				title: adder.name || adder.username || '',
				text,
				// Keep it on screen until acted on — a call is worth interrupting for.
				requireInteraction: true,
				actions: [{ action: 'join', title: i18n.t('Join_call', { lng: member.language }) }],
				payload: {
					_id: callId,
					rid,
					sender: { _id: adder._id, username: adder.username as string, name: adder.name },
					conferenceId: callId,
					message: { msg: text },
					audioNotificationValue: '',
				},
			});
		}
	}

	// Sends every added user a desktop notification about the conference; clicking it opens the room, and
	// the "Join call" action joins the conference directly.
	private async notifyUsersInvitedToConference(
		inviter: AtLeast<IUser, '_id' | 'username' | 'name'>,
		usernames: NonNullable<IUser['username']>[],
		callId: VideoConference['_id'],
		room: AtLeast<IRoom, '_id' | 't' | 'name' | 'fname'>,
	): Promise<void> {
		const invitedUsers = await Users.find<Pick<IUser, '_id' | 'language'>>(
			{ username: { $in: usernames } },
			{ projection: { language: 1 } },
		).toArray();

		const displayName = room.fname || room.name || '';

		for (const invited of invitedUsers) {
			const text = i18n.t('You_were_invited_to_a_conference', { lng: invited.language });
			void api.broadcast('notify.desktop', invited._id, {
				title: displayName,
				text,
				// Keep the invite on screen until the user acts on it.
				requireInteraction: true,
				actions: [{ action: 'join', title: i18n.t('Join_call', { lng: invited.language }) }],
				payload: {
					_id: room._id,
					rid: room._id,
					sender: { _id: inviter._id, username: inviter.username as string, name: inviter.name },
					type: room.t,
					name: room.name,
					conferenceId: callId,
					message: { msg: text },
					audioNotificationValue: '',
				},
			});
		}
	}

	private async getRoomForDiscussion(
		baseRoom: IRoom['_id'],
		childRoomIds: IRoom['_id'][] = [],
	): Promise<Pick<IRoom, '_id' | 't' | 'teamId' | 'prid'>> {
		const room = await Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'teamId' | 'prid'>>(baseRoom, {
			projection: { t: 1, teamId: 1, prid: 1 },
		});
		if (!room) {
			throw new Error('invalid-room');
		}

		if (room.prid) {
			if (childRoomIds.includes(room.prid)) {
				throw new Error('Room has circular reference.');
			}

			return this.getRoomForDiscussion(room.prid, [...childRoomIds, room._id]);
		}

		return room;
	}

	private async createDiscussionForConference(
		name: string,
		call: AtLeast<VideoConference, '_id' | 'rid' | 'createdBy'>,
		createdBy?: IUser,
	): Promise<void> {
		const room = await this.getRoomForDiscussion(call.rid);

		const type = await roomCoordinator.getRoomDirectives(room.t).getDiscussionType(room);
		const user = call.createdBy._id === createdBy?._id ? createdBy : await Users.findOneById(call.createdBy._id);
		if (!user) {
			throw new Error('invalid-user');
		}

		const discussion = await createRoom(
			type,
			Random.id(),
			user,
			[],
			false,
			false,
			{
				fname: name,
				prid: room._id,
				encrypted: false,
			},
			{
				creator: user._id,
				subscriptionExtra: {
					open: false,
				},
			},
		);

		return this.assignDiscussionToConference(call._id, discussion._id);
	}

	public async assignDiscussionToConference(callId: VideoConference['_id'], rid: IRoom['_id'] | undefined): Promise<void> {
		// Ensures the specified rid is a valid room
		const room = rid ? await Rooms.findOneById<Pick<IRoom, '_id' | 'prid'>>(rid, { projection: { prid: 1 } }) : null;
		if (rid && !room) {
			throw new Error('invalid-room-id');
		}

		const call = await VideoConferenceModel.findOneById(callId, { projection: { rid: 1, users: 1, messages: 1 } });
		if (!call) {
			return;
		}

		if (rid === undefined) {
			await VideoConferenceModel.unsetDiscussionRidById(callId);
		} else {
			await VideoConferenceModel.setDiscussionRidById(callId, rid);
		}

		try {
			if (room) {
				// Everyone involved with the call should land in the new discussion: the conference's members
				// (including any added from outside the room) plus the original room's members, who were part of
				// the conversation before the chat moved. Members who never joined the call are included on
				// purpose — the discussion is where they catch up.
				const roomMemberIds = (await Subscriptions.findByRoomId(call.rid, { projection: { 'u._id': 1 } }).toArray()).map(({ u }) => u._id);
				const recipients = new Set([...call.users.map(({ _id }) => _id), ...roomMemberIds]);

				await Promise.all([...recipients].map((uid) => this.addUserToDiscussion(room._id, uid)));
			}
		} finally {
			// Tell every participant's client that the conference's chat moved, so an open conference view
			// can follow it.
			void api.broadcast('video-conference.discussionUpdated', { callId, discussionRid: rid });
			// Also refresh the in-room conference message block, which listens on `notify-room/videoconf`
			// (the same channel used when users join), so its "Join discussion" button updates.
			this.notifyVideoConfUpdate(call.rid, callId);
		}
	}

	private async addUserToDiscussion(rid: IRoom['_id'], uid: IUser['_id']): Promise<void> {
		try {
			await Room.addUserToRoom(rid, { _id: uid }, undefined, { skipSystemMessage: true, createAsHidden: true });
		} catch (err) {
			// Ignore any errors here so that the subscription doesn't block the user from participating in the conference.
			logger.error({
				name: 'Error trying to subscribe user to discussion',
				err,
				rid,
				uid,
			});
		}
	}
}
