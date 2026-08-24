import { Apps } from '@rocket.chat/apps';
import type { AppVideoConfProviderManager } from '@rocket.chat/apps/dist/server/managers/AppVideoConfProviderManager';
import type { VideoConfData, VideoConfDataExtended } from '@rocket.chat/apps-engine/definition/videoConfProviders';
import type { IVideoConfService, VideoConferenceJoinOptions } from '@rocket.chat/core-services';
import { api, ServiceClassInternal, Message, Presence, Room } from '@rocket.chat/core-services';
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
	JoinableVideoConference,
	VideoConferenceChatAccess,
	VideoConferenceChatAccessMode,
	VideoConferenceCreateData,
	Optional,
	ExternalVideoConference,
	IVoIPVideoConference,
} from '@rocket.chat/core-typings';
import {
	UserStatus,
	VideoConferenceStatus,
	hasJoinedVideoConference,
	isDirectVideoConference,
	isInVideoConference,
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
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';

import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';
import { resolveChatAccessMode } from '../../../lib/videoConference/chatAccess';
import { conferenceNameFor } from '../../../lib/videoConference/conferenceName';
import { availabilityErrors, CALL_FACES_SHOWN, shouldRingVideoConference } from '../../../lib/videoConference/constants';
import { isUnaskedConferenceMember } from '../../../lib/videoConference/memberStatus';
import { expiredPresenceLeases, INFERRED_LEAVE_REASONS } from '../../../lib/videoConference/presence';
import { readSecondaryPreferred } from '../../database/readSecondaryPreferred';
import { canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';
import { callbacks } from '../../lib/callbacks';
import { i18n } from '../../lib/i18n';
import { isRoomCompatibleWithVideoConfRinging } from '../../lib/isRoomCompatibleWithVideoConfRinging';
import { RocketChatAssets } from '../../lib/media/assets';
import { sendMessage } from '../../lib/messages/sendMessage';
import { follow } from '../../lib/messaging/threads/functions';
import { metrics } from '../../lib/metrics/lib/metrics';
import { Push } from '../../lib/notifications/push/push';
import PushNotification from '../../lib/notifications/push-config/lib/PushNotification';
import { notifyOnMessageChange } from '../../lib/notifyListener';
import { createRoom } from '../../lib/rooms/createRoom';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { updateCounter } from '../../lib/statistics/functions/updateStatsCounter';
import { getUserAvatarURL } from '../../lib/utils/getUserAvatarURL';
import { getUserPreference } from '../../lib/utils/lib/getUserPreference';
import { videoConfPresence } from '../../lib/videoConfPresence';
import { videoConfProviders } from '../../lib/videoConfProviders';
import { videoConfTypes } from '../../lib/videoConfTypes';
import { addUsersToRoomMethod } from '../../meteor-methods/rooms/addUsersToRoom';
import { settings } from '../../settings';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

const logger = new Logger('VideoConference');

/**
 * How long a conference is kept alive after the last participant leaves, before it is ended.
 * Long enough for a reload to land and cancel it, short enough that a call really over doesn't linger.
 */
const EMPTY_CALL_GRACE_MS = 10_000;

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

	/**
	 * Tells anyone watching the conference that something about it moved — its membership, its chat's room, or who
	 * can read that chat. Whichever it was, the answer on the other side is to read the conference again, so this
	 * is one signal rather than three: the call window needs it to know whether it is still waiting on anyone, and
	 * a participant's chat panel needs it to follow the chat.
	 */
	private notifyConferenceUpdate(callId: VideoConference['_id']): void {
		void api.broadcast('video-conference.updated', { callId });
	}

	private async endCall(callId: VideoConference['_id']): Promise<void> {
		const call = await this.getUnfiltered(callId);
		if (!call) {
			return;
		}

		await VideoConferenceModel.setDataById(call._id, { endedAt: new Date(), status: VideoConferenceStatus.ENDED });
		await this.runVideoConferenceChangedEvent(call._id);
		this.notifyVideoConfUpdate(call.rid, call._id);

		if (videoConfProviders.getProviderCapabilities(call.providerName)?.embedded) {
			await this.notifyUsersOfRoom(call.rid, '', 'end', {
				callId: call._id,
				rid: call.rid,
				uid: call.createdBy._id,
			});
		}

		// Ending the call ends it for whoever was still in it, and each of them is owed their status back. Nobody
		// else reports their departure: the call is over, so there is no leave left to arrive.
		await Promise.all(call.users.filter(isInVideoConference).map(({ _id }) => this.releaseBusyForCall(_id)));

		if (call.type === 'direct') {
			return this.endDirectCall(call);
		}
	}

	private async expireCall(callId: VideoConference['_id']): Promise<void> {
		const call = await this.getUnfiltered(callId);
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
		// Embedded (built-in) providers like LiveKit are registered by core
		// only when their prerequisites are satisfied (e.g. VideoConf_LiveKit_
		// Enabled + URL + API key + secret). Their presence in the registry
		// IS the "fully configured" signal. Going through the apps-engine
		// manager would fail because there's no app behind them.
		if (videoConfProviders.getProviderCapabilities(providerName)?.embedded) {
			return;
		}
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

		// Being called makes you a member, exactly as being added to a group conference does. Without this the
		// callee only appears once they answer, so nothing can tell "still ringing" from "nobody was called",
		// and a call they missed leaves them no history entry.
		await this.addAbsentMember(callId, calleeId);

		await this.maybeCreateDiscussion(callId, user);

		const call = (await this.getUnfiltered(callId)) as IDirectVideoConference | null;
		if (!call) {
			throw new Error('failed-to-create-direct-call');
		}
		// Embedded providers (LiveKit) don't have an external URL to open —
		// the call is rendered inline. Skip URL generation for them.
		const isEmbedded = videoConfProviders.getProviderCapabilities(providerName)?.embedded === true;
		if (!isEmbedded) {
			const url = await this.generateNewUrl(call);
			await VideoConferenceModel.setUrlById(callId, url);
		}

		const messageId = await this.createMessage(call, user);
		call.messages.started = messageId;
		await VideoConferenceModel.setMessageById(callId, 'started', messageId);

		// Auto-follow the thread for anyone who joined between call creation and message creation.
		await this.autoFollowCallThreadForAllParticipants(call as IDirectVideoConference);

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

		// Embedded providers (LiveKit) render the call inline in Rocket.Chat —
		// no URL handoff. Skip both URL generation and ringing notifications:
		// the call shows up as an "active call" banner in the room and other
		// participants tap to join. No incoming-call sound/modal.
		const isEmbedded = videoConfProviders.getProviderCapabilities(providerName)?.embedded === true;
		if (!isEmbedded) {
			const url = await this.generateNewUrl(call);
			await VideoConferenceModel.setUrlById(callId, url);
			call.url = url;
		}

		const messageId = await this.createMessage(call, useAppUser ? undefined : user);
		call.messages.started = messageId;
		await VideoConferenceModel.setMessageById(callId, 'started', messageId);

		// Auto-follow the thread for anyone who joined between call creation and message creation.
		await this.autoFollowCallThreadForAllParticipants(call as IGroupVideoConference);

		if (call.ringing && !isEmbedded) {
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

		// Auto-follow the thread for anyone who joined between call creation and message creation.
		await this.autoFollowCallThreadForAllParticipants(call as ILivechatVideoConference);

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

		// Embedded providers (LiveKit) don't return a URL — the client mounts
		// the call inline via the embedded provider's React tree. We still
		// track the per-participant join time so the cleanup cron + the
		// raise-hand queue have something to work with. Returning an empty
		// string tells the client there's no URL to open.
		if (videoConfProviders.getProviderCapabilities(call.providerName)?.embedded) {
			if (user) {
				await VideoConferenceModel.addEmbeddedParticipant(call._id, {
					id: user._id,
					username: user.username,
					displayName: user.name,
					joinedAt: new Date(),
				});

				await this.notifyUsersOfRoom(call.rid, user._id, 'started', {
					callId: call._id,
					rid: call.rid,
					uid: call.createdBy._id,
				});

				this.notifyUser(user._id, 'started', { callId: call._id, rid: call.rid, uid: call.createdBy._id });
			}
			return '';
		}

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

		// Embedded (built-in) providers have no apps-engine app behind them,
		// so the provider-manager dispatch would be a no-op at best and
		// throw at worst. Skip the lifecycle hook for them.
		if (videoConfProviders.getProviderCapabilities(call.providerName)?.embedded) {
			return;
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

		if (videoConfProviders.getProviderCapabilities(call.providerName)?.embedded) {
			return;
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

		if (videoConfProviders.getProviderCapabilities(call.providerName)?.embedded) {
			return;
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

		// A user is in one call at a time, and this is where that becomes true rather than hoped for. A window that
		// dies without reporting its departure — a crash, a killed tab — otherwise leaves its user counted as
		// present forever, which both misreports them and keeps a finished call listed as occupied.
		await this.leaveOtherCalls(call._id, _id);

		// Already in the call — nothing to record. This asks about presence, not about having joined at some
		// point: a member who joined and left is joined-ever but absent, and returning here would leave their
		// `leftAt` in place, reporting them as gone while they are back on the call.
		const member = call.users.find((user) => user._id === _id);
		if (member && isInVideoConference(member)) {
			return;
		}

		// Both writes are idempotent, and both are needed: the first covers someone who wasn't a member yet
		// (it no-ops for an existing member), the second marks them present. Running both also closes the race
		// where two joins land between the read above and the write.
		await VideoConferenceModel.addMemberById(call._id, { _id, username, name, avatarETag, ts });
		await VideoConferenceModel.setUserJoinedById(call._id, _id, ts);
		this.notifyConferenceUpdate(call._id);

		// In a call is busy, for as long as it lasts.
		await this.claimBusyForCall(_id);

		// When persistent chat is in "thread" mode, auto-follow the call's chat
		// thread so the participant receives thread notifications for messages
		// sent during the call. `follow` uses $addToSet and is idempotent.
		await this.autoFollowCallThread(call, _id);

		if (call.type === 'direct') {
			await this.ringCalleeOnCallerArrival(call, _id);
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
		{ ring = true }: { ring?: boolean } = {},
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

			await VideoConferenceModel.addMemberById(callId, { ...user, ts });
			added.push(user._id);
		}

		if (added.length) {
			this.notifyVideoConfUpdate(call.rid, callId);
			this.notifyConferenceUpdate(callId);
		}

		// The list being rung is just the people added, and the endpoint caps a single add at the ringing limit —
		// so unlike starting a call in a large room, an add can always ring. Whether it does is the adder's to
		// say: someone added to carry on later is not someone to interrupt now.
		if (ring && shouldRingVideoConference(added.length)) {
			await this.ringUsers(callId, call.rid, uid, added);
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

		if (!call.users.some(({ _id }) => _id === uid) && !(await this.addAbsentMember(callId, uid))) {
			throw new Error('invalid-user');
		}

		await VideoConferenceModel.setUserDeclinedById(callId, uid);
		this.notifyVideoConfUpdate(call.rid, callId);
		this.notifyConferenceUpdate(callId);
	}

	/**
	 * Rings members who aren't in the call, again — all of them, or the ones asked for.
	 *
	 * A ring is one-shot, so the caller of a call nobody picked up needs a way to try again — and adding the
	 * same person a second time won't do it, since they are already a member. Returns who was rung.
	 *
	 * Members who already left are rung too: they were there and are not now, which is exactly the case
	 * "call them back" is for. Anyone already in the call is never rung, whether or not they were asked for.
	 */
	public async ringMembers(uid: IUser['_id'], callId: VideoConference['_id'], userIds?: IUser['_id'][]): Promise<IUser['_id'][]> {
		const call = await VideoConferenceModel.findOneById(callId, { projection: { rid: 1, users: 1, endedAt: 1 } });
		if (!call) {
			throw new Error('invalid-video-conference');
		}

		if (call.endedAt) {
			return [];
		}

		const requested = userIds?.length ? new Set(userIds) : undefined;
		const absent = call.users
			.filter((member) => member._id !== uid && !isInVideoConference(member) && (!requested || requested.has(member._id)))
			.map(({ _id }) => _id);

		if (!shouldRingVideoConference(absent.length)) {
			return [];
		}

		await this.ringUsers(callId, call.rid, uid, absent);

		return absent;
	}

	/**
	 * Associates a user with the call without marking them present — being a member is not being in the call.
	 *
	 * Two paths need it: being called, and declining a call you were only rung about as a room member. In both,
	 * the person has to exist on the call before anything — an answer, a decline, a history row — can be recorded
	 * against them. Says whether it found the user, which is the only thing the two callers disagree about.
	 */
	private async addAbsentMember(callId: VideoConference['_id'], uid: IUser['_id']): Promise<boolean> {
		const user = await Users.findOneById<Required<Pick<IUser, '_id' | 'username' | 'name' | 'avatarETag'>>>(uid, {
			projection: { username: 1, name: 1, avatarETag: 1 },
		});
		if (!user) {
			return false;
		}

		await VideoConferenceModel.addMemberById(callId, user);
		return true;
	}

	/** Leaves every other call this user is still counted as being in. See `addUserToCall`. */
	private async leaveOtherCalls(callId: VideoConference['_id'], uid: IUser['_id']): Promise<void> {
		// Asking the database for "still in it" rather than reading every membership and sifting in memory.
		const others = await VideoConferenceModel.find(
			{
				_id: { $ne: callId },
				endedAt: { $exists: false },
				users: { $elemMatch: { _id: uid, joined: { $ne: false }, leftAt: { $exists: false } } },
			},
			{ projection: { _id: 1 } },
		).toArray();

		// One at a time in practice, so the cost is a read that usually finds nothing.
		await Promise.all(others.map(({ _id }) => this.leaveCall(uid, _id)));
	}

	/**
	 * The calls that are running right now and that this user may join.
	 *
	 * This is how a call is reached without having caught its ring — which matters because a ring is one-shot and
	 * a conference started in a room with more than ten subscribers rings nobody at all.
	 *
	 * Nothing new is stored to answer it: the conference records already hold membership, liveness and the room.
	 * The scan is over *running* conferences rather than over this user's rooms, so its cost follows how many
	 * calls are in progress — few — rather than how many rooms the user is in.
	 *
	 * A call is offered when the user is a member of it, or is in the room it belongs to. Room *membership* rather
	 * than room *access*: a public channel is readable by anyone, and a call in a channel the user never joined
	 * has no business in their sidebar.
	 *
	 * Calls nobody is in are left out. A conference only stops when someone ends it or the expiry cron reaches it,
	 * so without this an abandoned one would be advertised as joinable for a day.
	 */
	public async listJoinableCalls(uid: IUser['_id']): Promise<JoinableVideoConference[]> {
		const running = await VideoConferenceModel.find(
			{ endedAt: { $exists: false } },
			// `createdBy` is here because naming a direct call needs it — a call is named after a person, and for a
			// member with no subscription that person is whoever started it.
			{ projection: { rid: 1, discussionRid: 1, users: 1, title: 1, type: 1, createdAt: 1, createdBy: 1 }, sort: { createdAt: -1 } },
		).toArray();

		const occupied = running.filter(({ users }) => users.some(isInVideoConference));

		// One query for every room in play. It decides both halves of the answer: whether the user is in the room,
		// and — for a direct message, which has no name of its own — what to call it, since a DM is named after the
		// other person and that name lives on each side's own subscription.
		const rids = [...new Set(occupied.flatMap(({ rid, discussionRid }) => [rid, discussionRid].filter((id): id is string => !!id)))];
		const subscriptions = new Map(
			rids.length
				? (await Subscriptions.findByUserIdAndRoomIds(uid, rids, { projection: { rid: 1, name: 1, fname: 1, t: 1 } }).toArray()).map(
						(sub) => [sub.rid, sub],
					)
				: [],
		);

		const joinable = occupied.filter((call) => {
			if (call.users.some(({ _id }) => _id === uid)) {
				return true;
			}

			return subscriptions.has(call.rid) || (!!call.discussionRid && subscriptions.has(call.discussionRid));
		});

		return Promise.all(
			joinable.map(async (call) => {
				const member = call.users.find(({ _id }) => _id === uid);
				const present = call.users.filter(isInVideoConference);
				const subscription = subscriptions.get(call.discussionRid || call.rid) ?? subscriptions.get(call.rid);

				return {
					callId: call._id,
					// The room is the last resort, and only for a call named after a room in the first place — a
					// direct call is named after a person, including for a member who has no subscription to read
					// one from. `getRoomName` ends at the raw room id, which is nobody's idea of a name.
					name:
						conferenceNameFor(call, uid, subscription?.fname || subscription?.name, subscription?.t) || (await this.getRoomName(call.rid)),
					createdAt: call.createdAt,
					usersCount: present.length,
					// A few of them travel with the call so the list can show faces. Capped here rather than at the
					// reader, because a call in a busy channel would otherwise send a roster to draw three avatars.
					participants: present.slice(0, CALL_FACES_SHOWN).map(({ _id, username, name }) => ({ _id, username, name })),
					joined: !!member && isInVideoConference(member),
					declined: !!member?.declined,
					// Whether that ring is still live is the reader's to decide, so the moment is what travels.
					...(member?.ringingAt && { ringingAt: member.ringingAt }),
				};
			}),
		);
	}

	/**
	 * Rings a set of members: the in-product ring, the desktop notification that reaches someone who isn't
	 * looking at the app, and the record of when it happened — which is what lets every client tell a phone that
	 * is ringing now from one that was rung and ignored.
	 */
	private async ringUsers(callId: VideoConference['_id'], rid: IRoom['_id'], uid: IUser['_id'], memberIds: IUser['_id'][]): Promise<void> {
		memberIds.forEach((memberId) => this.notifyUser(memberId, 'ring', { callId, rid, uid }));
		await VideoConferenceModel.setUsersRingingById(callId, memberIds);
		this.notifyConferenceUpdate(callId);

		// The ring only reaches a client that is on screen, and it is one-shot. A desktop notification is what
		// reaches someone who isn't looking at the app.
		await this.notifyUsersAddedToConference(uid, memberIds, callId, rid);
	}

	/**
	 * Rings the other side of a direct call when its caller arrives in it.
	 *
	 * Creating the call is not asking anyone to answer it: the caller lands on the preflight screen first, and
	 * being rung into a call whose caller is still choosing a camera means answering to an empty room. So the
	 * ring waits for them to actually enter — which is this moment.
	 *
	 * Only members who have never been rung, so rejoining doesn't ring anyone again; the call window's own
	 * "ring again" is how a second attempt is asked for.
	 */
	private async ringCalleeOnCallerArrival(call: IDirectVideoConference, uid: IUser['_id']): Promise<void> {
		if (call.createdBy._id !== uid) {
			return;
		}

		const absent = call.users.filter((user) => user._id !== uid && isUnaskedConferenceMember(user));
		if (!absent.length) {
			return;
		}

		await this.ringUsers(
			call._id,
			call.rid,
			uid,
			absent.map(({ _id }) => _id),
		);

		// The in-product ring only reaches a client that is on screen; a direct call is also worth a push.
		await Promise.all(absent.map(({ _id }) => this.sendPushNotification(call, _id)));
	}

	/**
	 * Records that a member left the call, and ends the conference once nobody is left in it.
	 *
	 * This is what gives a conference an end at all for providers that never report one — closing the call
	 * window is the only signal there is. Ending it is what writes everyone's call history, so without this a
	 * call sits at `STARTED` until the expiry cron notices it a day later.
	 *
	 * Leaving is not declining and not un-joining: membership and `joined` both stand, so the member keeps their
	 * history entry and can rejoin.
	 *
	 * The call is not ended the moment it empties. `pagehide` fires on a reload just as it does on a close, and
	 * the two are indistinguishable from it — so ending on the spot meant refreshing the call window killed the
	 * call. Instead the emptiness is confirmed after a grace period, which a rejoin cancels by simply being back
	 * in the call. That also absorbs a network blip taking the window down for a moment.
	 */
	public async leaveCall(uid: IUser['_id'], callId: VideoConference['_id']): Promise<void> {
		const call = await VideoConferenceModel.findOneById(callId, {
			projection: { rid: 1, users: 1, endedAt: 1, providerName: 1, createdBy: 1 },
		});
		if (!call || call.endedAt) {
			return;
		}

		if (!call.users.some(({ _id }) => _id === uid)) {
			return;
		}

		const leftAt = new Date();
		await VideoConferenceModel.setUserLeftById(callId, uid, leftAt);
		this.notifyVideoConfUpdate(call.rid, callId);
		this.notifyConferenceUpdate(callId);

		if (videoConfProviders.getProviderCapabilities(call.providerName)?.embedded) {
			await this.notifyUsersOfRoom(call.rid, uid, 'end', { callId: call._id, rid: call.rid, uid: call.createdBy._id });
			this.notifyUser(uid, 'end', { callId: call._id, rid: call.rid, uid: call.createdBy._id });
		}

		// Out of the call, so back to whatever status they had before it.
		await this.releaseBusyForCall(uid);

		// Decide on the state we just wrote rather than the one we read, so the member who is leaving is counted
		// as gone. Reading again would be a second round trip for the same answer.
		const remaining = call.users.map((member) => (member._id === uid ? { ...member, leftAt } : member));
		if (remaining.some(isInVideoConference)) {
			return;
		}

		setTimeout(() => {
			void this.endCallIfEmpty(callId).catch((err) => logger.error({ msg: 'Failed to end an empty conference', callId, err }));
		}, EMPTY_CALL_GRACE_MS);
	}

	/**
	 * Says the user is busy for as long as they are in a call, without overwriting the status they chose.
	 *
	 * A *claim* rather than a status. `internal` is the strongest source there is, so busy is what shows for as long
	 * as the call lasts; the status it displaced is stashed and handed back when the claim ends, which is how someone
	 * who set themselves away before the call is away again after it. A status the user sets *during* the call is
	 * queued the same way rather than displayed — the call is not overruled while it is happening, and their latest
	 * intent is what they are left with once it ends.
	 *
	 * Ended by id, so it can end in any order relative to a voice call's own claim: two `internal` claims stash for
	 * each other rather than one clobbering the other.
	 *
	 * Nothing here is allowed to break a call. Presence is a courtesy; joining is not.
	 */
	private async claimBusyForCall(uid: IUser['_id']): Promise<void> {
		try {
			const user = await Users.findOneById<Pick<IUser, '_id' | 'language'>>(uid, { projection: { language: 1 } });
			const lng = user?.language || settings.get<string>('Language') || 'en';

			await Presence.setActiveState(uid, {
				statusDefault: UserStatus.BUSY,
				statusText: i18n.t('Presence_status_on_a_call', { lng }),
				statusSource: 'internal',
				statusId: this.name,
			});
		} catch (err) {
			logger.warn({ msg: 'Failed to mark a user busy for a call', uid, err });
		}
	}

	/** Gives the user their own status back. A no-op if something with a stronger claim has taken over since. */
	private async releaseBusyForCall(uid: IUser['_id']): Promise<void> {
		try {
			await Presence.endActiveState(uid, this.name);
		} catch (err) {
			logger.warn({ msg: 'Failed to restore a user status after a call', uid, err });
		}
	}

	/**
	 * Renews a member's presence lease: their call window telling us it is still in the call.
	 *
	 * Provider-agnostic by construction — the conference window is ours whoever runs the media, so this is the one
	 * presence signal that exists for every provider. See `lib/videoConference/presence` for why presence is a
	 * lease rather than a reported departure.
	 */
	public async renewPresence(uid: IUser['_id'], callId: VideoConference['_id']): Promise<void> {
		await VideoConferenceModel.renewUserPresenceById(callId, uid, new Date(), INFERRED_LEAVE_REASONS);
	}

	/**
	 * Marks everyone whose presence lease has run out as having left, and ends the calls that empties.
	 *
	 * This is the durable half of leaving. `leaveCall` is the reported half: accurate, immediate, and impossible
	 * to rely on — it needs a live client talking to a live server, so it is lost exactly when the workspace goes
	 * down under a call that carries on in the provider. It is also lost by a crashed tab or a closed laptop, and
	 * the grace period `leaveCall` schedules for an emptied call is an in-process timer that a restart discards.
	 * Leases cover all of it, because their evidence lives in the database rather than in anyone's memory.
	 *
	 * Departures are stamped with the last evidence we had, never with the moment of the sweep — see
	 * `expiredPresenceLeases`. Callers must respect `isPresenceSweepDue` first: right after a restart every lease
	 * looks expired whether or not anyone actually left.
	 */
	public async expirePresenceLeases(now = new Date()): Promise<void> {
		for await (const call of VideoConferenceModel.findActiveWithMembers()) {
			try {
				// A provider that can say who is in its room is asked first, and its answer renews leases the same
				// way a client's heartbeat does. Silence is not absence: `undefined` leaves the leases as they are.
				const present = await videoConfPresence.getProbe(call.providerName)?.(call);
				const users = present ? call.users.map((user) => (present.includes(user._id) ? { ...user, lastSeenAt: now } : user)) : call.users;

				if (present?.length) {
					await VideoConferenceModel.renewUsersPresenceById(call._id, present, now);
				}

				const expired = expiredPresenceLeases(users, now);
				if (!expired.length) {
					continue;
				}

				for (const { uid, leftAt } of expired) {
					logger.info({ msg: 'Presence lease expired', callId: call._id, uid, leftAt });
					await VideoConferenceModel.setUserLeftById(call._id, uid, leftAt, 'timeout');
					// Whoever stopped renewing is not in a call any more, whatever their client failed to say — and a
					// status left on busy by a crashed tab is exactly the kind of thing nobody thinks to fix by hand.
					await this.releaseBusyForCall(uid);
					// Embedded providers keep a second per-participant record, and the two disagreeing is how a
					// call ends up counted as occupied by one half of the code and empty by the other.
					await VideoConferenceModel.markEmbeddedParticipantLeft(call._id, uid, leftAt);
				}

				this.notifyVideoConfUpdate(call.rid, call._id);
				this.notifyConferenceUpdate(call._id);

				// No second grace period: the lease *was* the grace period, and it is far longer than the one a
				// reported departure gets. Anyone who came back renewed it and is not in `expired` at all.
				const remaining = users.filter(({ _id }) => !expired.some((lease) => lease.uid === _id));
				if (!remaining.some(isInVideoConference)) {
					await this.endCall(call._id);
				}
			} catch (err) {
				// One unreachable provider or one malformed call must not stop the sweep for every other call.
				logger.error({ msg: 'Failed to expire presence leases for a conference', callId: call._id, err });
			}
		}
	}

	/** Ends a conference only if it is still empty — a rejoin inside the grace period is what cancels it. */
	private async endCallIfEmpty(callId: VideoConference['_id']): Promise<void> {
		const call = await VideoConferenceModel.findOneById(callId, { projection: { users: 1, endedAt: 1 } });
		if (!call || call.endedAt || call.users.some(isInVideoConference)) {
			return;
		}

		await this.endCall(callId);
	}

	/**
	 * Where the conference's chat lives and which members can't read it, because membership deliberately grants
	 * no room access. Surfacing them is the point: the choice of how to fix it is offered once it actually
	 * matters, rather than being forced on whoever adds a participant — so this also reports what that choice
	 * is, since it depends on the room and on who is asking.
	 *
	 * Access isn't always a subscription question — a plain public channel is readable by anyone, so
	 * `getMembersWithoutRoomAccess` answers both that and the plain private-room case from one `Subscriptions`
	 * read instead of one authorization call per member. A team-owned, discussion, or ABAC-attributed room can
	 * grant access through paths a room+subscriptions read can't see (team membership, the parent room's own
	 * rules, an ABAC decision), so those still ask per member — getting one of those wrong is worse than the
	 * extra reads, and conferences are small.
	 */
	public async getChatAccess(uid: IUser['_id'], callId: VideoConference['_id']): Promise<VideoConferenceChatAccess> {
		return (await this.resolveChatAccess(uid, callId)).access;
	}

	/**
	 * `getChatAccess`, plus the *usernames* of the members it decided about.
	 *
	 * The public shape carries ids, because that is what a client matches against the members it already holds. A
	 * room invite needs usernames — and they were in hand while the ids were being worked out, so resolving the
	 * access doesn't have to read the conference a second time to find them.
	 */
	private async resolveChatAccess(
		uid: IUser['_id'],
		callId: VideoConference['_id'],
	): Promise<{ access: VideoConferenceChatAccess; usernamesWithoutAccess: NonNullable<IUser['username']>[] }> {
		const call = await VideoConferenceModel.findOneById(callId, { projection: { rid: 1, discussionRid: 1, users: 1 } });
		if (!call) {
			throw new Error('invalid-video-conference');
		}

		const rid = call.discussionRid || call.rid;
		const room = await Rooms.findOneById(rid);
		if (!room) {
			throw new Error('invalid-room');
		}

		const membersWithoutAccess = await this.getMembersWithoutRoomAccess(
			room,
			call.users.map(({ _id }) => _id),
		);
		const withoutAccess = new Set(membersWithoutAccess);

		return {
			access: {
				rid,
				name: room.fname || room.name || '',
				type: room.t,
				membersWithoutAccess,
				// Ask the room whether it can take new members rather than testing for a DM: the room type owns that
				// rule, and it accounts for cases a `t === 'd'` check would miss, like a federated DM that *can* grow.
				canInvite: await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.INVITE, uid),
			},
			usernamesWithoutAccess: call.users
				.filter(({ _id }) => withoutAccess.has(_id))
				.map(({ username }) => username)
				.filter((username): username is string => !!username),
		};
	}

	/**
	 * A team-owned public channel can be read by any team member without them ever having subscribed to it, a
	 * discussion inherits its access from the parent room it was split off from, and a room carrying ABAC
	 * attributes can bypass subscriptions entirely — none of that is visible from this room's own subscriptions,
	 * so those keep asking `canAccessRoomIdAsync` once per member, exactly as before.
	 *
	 * Everything else reduces to one `Subscriptions` read for every member at once: a plain public channel (no
	 * team) is readable by anyone unless banned from it specifically, and a plain private room (group or DM) is
	 * readable only by whoever holds an actual, non-invited subscription to it.
	 */
	private async getMembersWithoutRoomAccess(
		room: Pick<IRoom, '_id' | 't' | 'teamId' | 'prid' | 'abacAttributes'>,
		memberIds: IUser['_id'][],
	): Promise<IUser['_id'][]> {
		if (!memberIds.length) {
			return [];
		}

		if ((room.t === 'c' && room.teamId) || room.prid || room.abacAttributes?.length) {
			const access = await Promise.all(memberIds.map(async (_id) => ({ _id, allowed: await canAccessRoomIdAsync(room._id, _id) })));
			return access.filter(({ allowed }) => !allowed).map(({ _id }) => _id);
		}

		const subscriptions = await Subscriptions.findByRoomIdAndUserIds(room._id, memberIds, {
			projection: { 'u._id': 1, 'status': 1 },
		}).toArray();
		const statusByMember = new Map(subscriptions.map(({ u, status }) => [u._id, status]));

		if (room.t === 'c') {
			return memberIds.filter((_id) => statusByMember.get(_id) === 'BANNED');
		}

		// A subscription with a `status` (invited, banned) doesn't count as one: only an existing, plain
		// subscription does, the same as `canAccessRoomIdAsync` would find for a private room.
		return memberIds.filter((_id) => !statusByMember.has(_id) || statusByMember.get(_id) !== undefined);
	}

	/**
	 * Names a running group conference, for the person who started it.
	 *
	 * The name is what the provider is told to call the meeting and what the call is listed as everywhere it
	 * appears, so it is worth being able to set it once the call exists rather than only in the instant it is
	 * created. Only the creator: a title everyone in the call could rewrite is a title nobody can rely on.
	 *
	 * A direct call has no title of its own — it is named after the other person — so there is nothing to set.
	 */
	public async renameCall(uid: IUser['_id'], callId: VideoConference['_id'], title: string): Promise<void> {
		const call = await VideoConferenceModel.findOneById<VideoConference>(callId, {
			projection: { type: 1, rid: 1, createdBy: 1, endedAt: 1 },
		});
		if (!call || call.endedAt || !isGroupVideoConference(call)) {
			throw new Error('error-invalid-video-conf');
		}

		if (call.createdBy._id !== uid) {
			throw new Error('error-not-allowed');
		}

		const name = title.trim();
		if (!name) {
			throw new Error('error-invalid-name');
		}

		await VideoConferenceModel.setTitleById(callId, name);
		this.notifyVideoConfUpdate(call.rid, callId);
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
		const {
			access: { rid, membersWithoutAccess, canInvite, type },
			usernamesWithoutAccess: usernames,
		} = await this.resolveChatAccess(uid, callId);
		if (!membersWithoutAccess.length) {
			return rid;
		}

		const resolved = resolveChatAccessMode({ mode, canInvite, type });
		if (!resolved) {
			throw new Error('error-not-allowed');
		}

		if (resolved === 'discussion') {
			// Moving the chat to a discussion announces the conference itself changed, which is what makes every
			// participant's panel follow the chat to its new room.
			return this.createConferenceDiscussionWithParticipants(uid, callId, usernames);
		}

		const invitedRid = await this.addUsersToConferenceRoom(uid, callId, usernames);

		// Inviting leaves the conference record untouched — only who can read the chat changed — so nothing else
		// tells the participants to look again. Without this their notice stays up until a reload.
		this.notifyConferenceUpdate(callId);

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
		return settings.get<boolean>('VideoConf_Enable_Persistent_Chat');
	}

	private getPersistentChatMode(): 'thread' | 'main_room' {
		return (settings.get<string>('VideoConf_Persistent_Chat_Mode') as 'thread' | 'main_room') || 'thread';
	}

	/**
	 * Auto-follow the call's chat thread for a single user. Called when a
	 * participant joins the call, so they receive thread notifications for
	 * messages posted during the conference. Only applies when persistent
	 * chat is enabled in "thread" mode and the started message already
	 * exists. The underlying `follow` is idempotent ($addToSet).
	 */
	private async autoFollowCallThread(call: Optional<VideoConference, 'providerData'>, uid: IUser['_id']): Promise<void> {
		if (!this.isPersistentChatEnabled() || this.getPersistentChatMode() !== 'thread') {
			return;
		}

		if (!call.messages.started) {
			return;
		}

		await follow({ tmid: call.messages.started, uid });
	}

	/**
	 * Auto-follow the call's chat thread for every participant already in
	 * the call. Called when `messages.started` is first set (i.e. the
	 * thread parent message has just been created) so that any user who
	 * joined before the message existed gets subscribed retroactively.
	 */
	private async autoFollowCallThreadForAllParticipants(call: VideoConference): Promise<void> {
		if (!this.isPersistentChatEnabled() || this.getPersistentChatMode() !== 'thread') {
			return;
		}

		if (!call.messages.started || !call.users.length) {
			return;
		}

		await Promise.all(call.users.map(({ _id }) => follow({ tmid: call.messages.started!, uid: _id })));
	}

	private async maybeCreateDiscussion(callId: VideoConference['_id'], createdBy?: IUser): Promise<void> {
		if (!this.isPersistentChatEnabled() || this.getPersistentChatMode() !== 'main_room' || !settings.get<boolean>('Discussion_enabled')) {
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
	private async createConferenceDiscussionWithParticipants(
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
		// `discussionRid`. This sets it and announces the change so participants follow along.
		await this.assignDiscussionToConference(callId, discussion._id);

		// Let the newly invited users know with a desktop notification; clicking it opens the discussion.
		await this.notifyUsersInvitedToConference(user, usernames, callId, discussion);

		return discussion._id;
	}

	// Adds the users to the conference's active room, so they get its history — the counterpart to
	// `createConferenceDiscussionWithParticipants`.
	private async addUsersToConferenceRoom(
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
	 * Tells people about a conference through the desktop, for the case the in-product ring can't reach: a
	 * backgrounded tab, or no client open at all. Clicking focuses the app, and the "Join call" action joins the
	 * conference itself.
	 *
	 * Whether it carries a **room** is the one thing that matters here, because that is what makes the click
	 * navigate. Someone invited *into* the room can be sent there; someone merely added to the call cannot —
	 * membership grants no room access, so the room behind the call may be one they can't open.
	 */
	private async notifyUsersAboutConference({
		recipients,
		sender,
		callId,
		rid,
		title,
		room,
	}: {
		recipients: Pick<IUser, '_id' | 'language'>[];
		sender: AtLeast<IUser, '_id' | 'username' | 'name'>;
		callId: VideoConference['_id'];
		rid: IRoom['_id'];
		title: string;
		/** Given only when the recipients can open it, which is what lets the notification navigate there. */
		room?: AtLeast<IRoom, 't' | 'name'>;
	}): Promise<void> {
		for (const recipient of recipients) {
			const text = i18n.t('You_were_invited_to_a_conference', { lng: recipient.language });

			void api.broadcast('notify.desktop', recipient._id, {
				title,
				text,
				// Keep it on screen until acted on — a call is worth interrupting for.
				requireInteraction: true,
				actions: [{ action: 'join', title: i18n.t('Join_call', { lng: recipient.language }) }],
				payload: {
					_id: callId,
					rid,
					sender: { _id: sender._id, username: sender.username as string, name: sender.name },
					...(room && { type: room.t, name: room.name }),
					conferenceId: callId,
					message: { msg: text },
					// The ringing popup plays the ringtone. Left unset this would also play the new-message sound,
					// so a call announced itself as a message arriving.
					audioNotificationValue: 'none',
				},
			});
		}
	}

	/** Tells the users just added to a conference that it is ringing for them. */
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

		await this.notifyUsersAboutConference({
			recipients: members,
			sender: adder,
			callId,
			rid,
			title: adder.name || adder.username || '',
		});
	}

	/** Tells the users just invited into the conference's room about it; clicking takes them to that room. */
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

		await this.notifyUsersAboutConference({
			recipients: invitedUsers,
			sender: inviter,
			callId,
			rid: room._id,
			title: room.fname || room.name || '',
			room,
		});
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
			this.notifyConferenceUpdate(callId);
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
