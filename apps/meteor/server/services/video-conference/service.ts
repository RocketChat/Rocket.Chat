import { Apps } from '@rocket.chat/apps';
import type { VideoConfData, VideoConfDataExtended } from '@rocket.chat/apps-engine/definition/videoConfProviders';
import type { AppVideoConfProviderManager } from '@rocket.chat/apps-engine/server/managers';
import type { IVideoConfService, VideoConferenceJoinOptions } from '@rocket.chat/core-services';
import { api, ServiceClassInternal, Room } from '@rocket.chat/core-services';
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
	VideoConferenceCreateData,
	Optional,
	ExternalVideoConference,
	IVoIPVideoConference,
} from '@rocket.chat/core-typings';
import {
	VideoConferenceStatus,
	isDirectVideoConference,
	isGroupVideoConference,
	isLivechatVideoConference,
} from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { Users, VideoConference as VideoConferenceModel, Rooms, Messages, Subscriptions } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import { wrapExceptions } from '@rocket.chat/tools';
import type * as UiKit from '@rocket.chat/ui-kit';
import { MongoInternals } from 'meteor/mongo';

import { RocketChatAssets } from '../../../app/assets/server';
import { canAccessRoomIdAsync } from '../../../app/authorization/server/functions/canAccessRoom';
import { createRoom } from '../../../app/lib/server/functions/createRoom';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { notifyOnMessageChange } from '../../../app/lib/server/lib/notifyListener';
import { metrics } from '../../../app/metrics/server/lib/metrics';
import { Push } from '../../../app/push/server/push';
import PushNotification from '../../../app/push-notifications/server/lib/PushNotification';
import { settings } from '../../../app/settings/server';
import { updateCounter } from '../../../app/statistics/server/functions/updateStatsCounter';
import { getUserAvatarURL } from '../../../app/utils/server/getUserAvatarURL';
import { getUserPreference } from '../../../app/utils/server/lib/getUserPreference';
import { callbacks } from '../../../lib/callbacks';
import { availabilityErrors } from '../../../lib/videoConference/constants';
import { readSecondaryPreferred } from '../../database/readSecondaryPreferred';
import { i18n } from '../../lib/i18n';
import { isRoomCompatibleWithVideoConfRinging } from '../../lib/isRoomCompatibleWithVideoConfRinging';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { videoConfProviders } from '../../lib/videoConfProviders';
import { videoConfTypes } from '../../lib/videoConfTypes';

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
		}).catch((e) => {
			logger.error({
				name: 'Error on VideoConf.create',
				error: e,
			});
			throw e;
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
			} as VideoConferenceCreateData;

			if (data.type === 'videoconference') {
				data.title = title;
			}

			return this.create(data, false);
		}).catch((e) => {
			logger.error({
				name: 'Error on VideoConf.start',
				error: e,
			});
			throw e;
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
		}).catch((e) => {
			logger.error({
				name: 'Error on VideoConf.join',
				error: e,
			});
			throw e;
		});
	}

	public async getInfo(callId: VideoConference['_id'], uid: IUser['_id'] | undefined): Promise<UiKit.LayoutBlock[]> {
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
			return blocks as UiKit.LayoutBlock[];
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
	): Promise<PaginatedResult<{ data: VideoConference[] }>> {
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

		return {
			videoConference: {
				started: await VideoConferenceModel.countByTypeAndStatus('videoconference', VideoConferenceStatus.STARTED, options),
				ended: await VideoConferenceModel.countByTypeAndStatus('videoconference', VideoConferenceStatus.ENDED, options),
			},
			direct: {
				calling: await VideoConferenceModel.countByTypeAndStatus('direct', VideoConferenceStatus.CALLING, options),
				started: await VideoConferenceModel.countByTypeAndStatus('direct', VideoConferenceStatus.STARTED, options),
				ended: await VideoConferenceModel.countByTypeAndStatus('direct', VideoConferenceStatus.ENDED, options),
			},
			livechat: {
				started: await VideoConferenceModel.countByTypeAndStatus('livechat', VideoConferenceStatus.STARTED, options),
				ended: await VideoConferenceModel.countByTypeAndStatus('livechat', VideoConferenceStatus.ENDED, options),
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

		if (call.type === 'direct') {
			return this.endDirectCall(call);
		}
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

		const message = await sendMessage(user, record, room, false);

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

		metrics.notificationsSent.inc({ notification_type: 'mobile' });
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
			createdBy: call.createdBy as Required<VideoConference['createdBy']>,
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
			createdBy: call.createdBy as Required<VideoConference['createdBy']>,
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

		if (call.users.find((user) => user._id === _id)) {
			return;
		}

		await VideoConferenceModel.addUserById(call._id, { _id, username, name, avatarETag, ts });

		if (call.type === 'direct') {
			return this.updateDirectCall(call as IDirectVideoConference, _id);
		}

		this.notifyVideoConfUpdate(call.rid, call._id);
	}

	private async addAnonymousUser(call: Optional<IGroupVideoConference, 'providerData'>): Promise<void> {
		await VideoConferenceModel.increaseAnonymousCount(call._id);
	}

	private async updateDirectCall(call: IDirectVideoConference, newUserId: IUser['_id']): Promise<void> {
		// If it's an user that hasn't joined yet
		if (call.ringing && !call.users.find(({ _id }) => _id === newUserId)) {
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

		const name = settings.get<string>('VideoConf_Persistent_Chat_Discussion_Name') || i18n.t('[date] Video Call Chat');
		let displayName;
		const date = new Date().toISOString().substring(0, 10);

		if (name.includes('[date]')) {
			displayName = name.replace('[date]', date);
		} else {
			displayName = `${date} ${name}`;
		}

		await this.createDiscussionForConference(displayName, call, createdBy);
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

		const call = await VideoConferenceModel.findOneById(callId, { projection: { users: 1, messages: 1 } });
		if (!call) {
			return;
		}

		if (rid === undefined) {
			await VideoConferenceModel.unsetDiscussionRidById(callId);
		} else {
			await VideoConferenceModel.setDiscussionRidById(callId, rid);
		}

		if (room) {
			await Promise.all(call.users.map(({ _id }) => this.addUserToDiscussion(room._id, _id)));
		}
	}

	private async addUserToDiscussion(rid: IRoom['_id'], uid: IUser['_id']): Promise<void> {
		try {
			await Room.addUserToRoom(rid, { _id: uid }, undefined, { skipSystemMessage: true, createAsHidden: true });
		} catch (error) {
			// Ignore any errors here so that the subscription doesn't block the user from participating in the conference.
			logger.error({
				name: 'Error trying to subscribe user to discussion',
				error,
				rid,
				uid,
			});
		}
	}
}
