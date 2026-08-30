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
import { availabilityErrors, CALL_FACES_SHOWN, EMPTY_CALL_GRACE_MS, shouldRingRecipients } from '../../../lib/videoConference/constants';
import { canRingConferenceMember, isUnaskedConferenceMember } from '../../../lib/videoConference/memberStatus';
import { expiredPresenceLeases, INFERRED_LEAVE_REASONS } from '../../../lib/videoConference/presence';
import { readSecondaryPreferred } from '../../database/readSecondaryPreferred';
import { canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';
import { hasAtLeastOnePermissionAsync } from '../../lib/authorization/hasPermission';
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

	/** Whether the provider runs the call inside Rocket.Chat rather than at a page of its own. */
	private isEmbeddedProvider(providerName: string): boolean {
		return videoConfProviders.getProviderCapabilities(providerName)?.embedded === true;
	}

	private supportsPersistentChat(providerName: string): boolean {
		return videoConfProviders.getProviderCapabilities(providerName)?.persistentChat === true;
	}

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

		// The ongoing-calls list is refreshed by this broadcast and nothing else: a call that ends without one
		// stays listed.
		if (this.runsInOurCallWindow(call.providerName)) {
			await this.notifyCallAndRoomUsers(call, 'end', {
				callId: call._id,
				rid: call.rid,
				uid: call.createdBy._id,
			});
		}

		if (this.isEmbeddedProvider(call.providerName)) {
			// Ending the call ends it for whoever was still in it, and each of them is owed their status back. Nobody
			// else reports their departure: the call is over, so there is no leave left to arrive. Only embedded joins
			// claim busy in the first place, so only they have anything to give back.
			await Promise.all(call.users.filter(isInVideoConference).map(({ _id }) => this.releaseBusyForCall(_id)));
		}

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
			// Skip notifying users that already joined the call. Actually joined: an embedded callee is on the
			// roster from the moment they are called, so mere membership would swallow the 'end' that is meant
			// to stop their ringing.
			const member = call.users.find(({ _id }) => _id === subscription.u._id);
			if (member && hasJoinedVideoConference(member)) {
				continue;
			}

			this.notifyUser(subscription.u._id, 'end', params);
		}
	}

	/**
	 * What the thread on a call's message should be called, or nothing where the question doesn't arise: a call
	 * whose chat is not a thread, a direct call, or a group call nobody named.
	 */
	private threadTitleFor(call: VideoConference): string {
		if (!isGroupVideoConference(call) || !this.chatLivesInAThread()) {
			return '';
		}

		return call.title?.trim() || '';
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
			// Names the thread, which takes its title from this parent. Invisible in the room itself: a message
			// carrying blocks renders those and never its text. Falls back to the localised name rather than an
			// empty string, which is what made a new conference arrive as an empty notification (#41156).
			msg:
				this.threadTitleFor(call) ||
				i18n.t('Video_Conference', {
					lng: createdBy?.language || settings.get('Language') || 'en',
				}),
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

	/**
	 * Whether this call happens inside a window of ours, rather than being handed off to a page we don't run.
	 *
	 * True for a provider that renders inside Rocket.Chat, and true for *any* provider once the conference window
	 * is enabled — an iframed provider renders inside our page, so our code is alive there either way.
	 */
	private runsInOurCallWindow(providerName: string): boolean {
		return (
			videoConfProviders.getProviderCapabilities(providerName)?.embedded === true ||
			settings.get<boolean>('VideoConf_Conference_Window_Enabled') === true
		);
	}

	private async validateProvider(providerName: string): Promise<void> {
		// There is no app behind a built-in provider, so the apps-engine manager has nothing to ask. Core only
		// registers one once its settings are complete, which makes its presence the configured signal.
		if (this.isEmbeddedProvider(providerName)) {
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

		const isEmbedded = this.isEmbeddedProvider(providerName);

		// Being called makes you a member, so "still ringing" can be told from "nobody was called" and a missed
		// call leaves a history entry. Only where the ring waits for the caller: a callee rung at creation has
		// always entered `users` by answering, and doing it earlier rewrites the history clients build from it.
		if (this.runsInOurCallWindow(providerName)) {
			await this.addAbsentMember(callId, calleeId);
		}

		await this.maybeCreateDiscussion(callId, user);

		const call = (await this.getUnfiltered(callId)) as IDirectVideoConference | null;
		if (!call) {
			throw new Error('failed-to-create-direct-call');
		}
		// Embedded providers (LiveKit) don't have an external URL to open —
		// the call is rendered inline. Skip URL generation for them.
		if (!isEmbedded) {
			const url = await this.generateNewUrl(call);
			await VideoConferenceModel.setUrlById(callId, url);
		}

		const messageId = await this.createMessage(call, user);
		call.messages.started = messageId;
		await VideoConferenceModel.setMessageById(callId, 'started', messageId);

		// Auto-follow the thread for anyone who joined between call creation and message creation.
		await this.autoFollowCallThreadForAllParticipants(call);

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

		// Where the ring waits for the caller, so does the push — `ringCalleeOnCallerArrival` sends it, and
		// pushing here as well buzzes the callee twice for one call.
		if (!this.runsInOurCallWindow(providerName)) {
			await this.sendPushNotification(call, calleeId);
		}

		return {
			type: 'direct',
			callId,
			calleeId,
		};
	}

	/**
	 * Everyone the end of a call concerns, which is not the same as everyone in its room.
	 *
	 * Conference membership grants no room access, so members with no subscription have to be added to the
	 * room's audience explicitly. Only the end is broadcast this way.
	 */
	private async notifyCallAndRoomUsers(
		call: AtLeast<VideoConference, '_id' | 'rid' | 'users'>,
		action: string,
		params: { uid: IUser['_id']; rid: IRoom['_id']; callId: VideoConference['_id'] },
	): Promise<void> {
		const roomMemberIds = (await Subscriptions.findByRoomId(call.rid, { projection: { 'u._id': 1 } }).toArray()).map(({ u }) => u._id);
		const recipients = new Set([...roomMemberIds, ...call.users.map(({ _id }) => _id)]);

		recipients.forEach((userId) => this.notifyUser(userId, action, params));
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

		// An embedded call has no URL to hand off and announces itself as a banner in the room, so neither the
		// URL nor the ring applies.
		const isEmbedded = this.isEmbeddedProvider(providerName);
		if (!isEmbedded) {
			const url = await this.generateNewUrl(call);
			await VideoConferenceModel.setUrlById(callId, url);
			call.url = url;
		}

		const messageId = await this.createMessage(call, useAppUser ? undefined : user);
		call.messages.started = messageId;
		await VideoConferenceModel.setMessageById(callId, 'started', messageId);

		// Auto-follow the thread for anyone who joined between call creation and message creation.
		await this.autoFollowCallThreadForAllParticipants(call);

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
		await this.autoFollowCallThreadForAllParticipants(call);

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

		// Arriving changes which calls are worth offering, so it is announced to the room and to the arriver's
		// own other sessions — which is what stops the app behind the call window offering them another.
		if (user && this.runsInOurCallWindow(call.providerName)) {
			await this.notifyUsersOfRoom(call.rid, user._id, 'started', {
				callId: call._id,
				rid: call.rid,
				uid: call.createdBy._id,
			});

			this.notifyUser(user._id, 'started', { callId: call._id, rid: call.rid, uid: call.createdBy._id });
		}

		// Embedded providers (LiveKit) don't return a URL — the client mounts the call inline via the embedded
		// provider's React tree, so the empty string is what tells it there is nothing to open. Who is in the
		// call is the roster's business either way: that entry is the `onJoinVideoConference` callback's doing,
		// fired above for every provider alike.
		if (this.isEmbeddedProvider(call.providerName)) {
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
		if (this.isEmbeddedProvider(call.providerName)) {
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

		if (this.isEmbeddedProvider(call.providerName)) {
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

		if (this.isEmbeddedProvider(call.providerName)) {
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

		// The whole join-side lifecycle below only exists for embedded providers. A non-embedded call (Jitsi,
		// Meet, ...) has no leave, no heartbeat and no sweep — nothing would ever undo what gets claimed here —
		// so for those a join must do what it always did: record the member, and nothing else.
		const isEmbedded = this.isEmbeddedProvider(call.providerName);

		// A user is in one call at a time, and this is where that becomes true rather than hoped for. A window that
		// dies without reporting its departure — a crash, a killed tab — otherwise leaves its user counted as
		// present forever, which both misreports them and keeps a finished call listed as occupied.
		if (isEmbedded) {
			await this.leaveOtherCalls(call._id, _id);
		}

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
		// And the room, as every other change to the roster does, so the call's message block keeps its count.
		this.notifyVideoConfUpdate(call.rid, call._id);

		// In a call is busy, for as long as it lasts. Embedded only: the claim is released by leaving, by the
		// heartbeat sweep or by the call ending, and a non-embedded call has none of those — the claim would
		// outrank whatever status the user sets by hand, leaving them busy forever.
		if (isEmbedded) {
			await this.claimBusyForCall(_id);
		}

		// When persistent chat is in "thread" mode, auto-follow the call's chat
		// thread so the participant receives thread notifications for messages
		// sent during the call. `follow` uses $addToSet and is idempotent.
		await this.autoFollowCallThread(call, _id);

		if (call.type === 'direct') {
			// Asked of the call rather than of the setting, so an admin toggling the window mid-call cannot decide
			// differently than its creation did.
			const rang = call.status === VideoConferenceStatus.CALLING ? await this.ringCalleeOnCallerArrival(call, _id) : false;

			return this.updateDirectCall(call, _id, { pushed: rang });
		}
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
		const call = await VideoConferenceModel.findOneById(callId, { projection: { rid: 1, users: 1, endedAt: 1 } });
		if (!call) {
			throw new Error('invalid-video-conference');
		}

		// A finished call is not something to add people to — and certainly not something to ring them into.
		// Same answer `ringMember` gives: nobody was added.
		if (call.endedAt) {
			return [];
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
		if (ring && shouldRingRecipients(added.length)) {
			await this.ringUsers(callId, call.rid, uid, added);
		}

		return added;
	}

	/**
	 * Records that a user dismissed the call instead of joining.
	 *
	 * Never ends the conference, and never stops them joining later. A member rung without an entry gets one,
	 * so there is somewhere to record it.
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
	 * Rings one member who is not in the call, again. Says whether the ring went out.
	 *
	 * Never someone already in the call, and never someone whose phone is ringing now — there is nothing more
	 * to ask of either. A member who left is rung, which is what calling them back means.
	 */
	public async ringMember(uid: IUser['_id'], callId: VideoConference['_id'], memberId: IUser['_id']): Promise<boolean> {
		const call = await VideoConferenceModel.findOneById(callId, { projection: { rid: 1, users: 1, endedAt: 1 } });
		if (!call) {
			throw new Error('invalid-video-conference');
		}

		if (call.endedAt) {
			return false;
		}

		const member = call.users.find(({ _id }) => _id === memberId);
		if (memberId === uid || !member || !canRingConferenceMember(member)) {
			return false;
		}

		await this.ringUsers(callId, call.rid, uid, [memberId]);

		return true;
	}

	/**
	 * Associates a user with the call without marking them present. Says whether the user was found.
	 *
	 * A person has to exist on the call before an answer, a decline or a history row can be recorded for them.
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

	private async leaveOtherCalls(callId: VideoConference['_id'], uid: IUser['_id']): Promise<void> {
		// The status predicate names the statuses the partial index is filtered on, which is what makes it
		// eligible. `endedAt` stays because that, not the index filter, is the liveness rule.
		const others = await VideoConferenceModel.find(
			{
				_id: { $ne: callId },
				status: { $in: [VideoConferenceStatus.CALLING, VideoConferenceStatus.STARTED] },
				endedAt: { $exists: false },
				users: { $elemMatch: { _id: uid, joined: { $ne: false }, leftAt: { $exists: false } } },
			},
			{ projection: { _id: 1 } },
		).toArray();

		// One at a time in practice, so the cost is a read that usually finds nothing.
		await Promise.all(others.map(({ _id }) => this.leaveCall(uid, _id)));
	}

	/**
	 * The calls running right now that this user may join.
	 *
	 * Room membership rather than room access, so a call in a public channel they never joined stays out of
	 * their sidebar. Calls nobody is in are left out.
	 */
	public async listJoinableCalls(uid: IUser['_id']): Promise<JoinableVideoConference[]> {
		// The status predicate matches the partial index's filter so the scan can be served by it; `endedAt` is
		// still the liveness rule itself.
		const running = await VideoConferenceModel.find(
			{ status: { $in: [VideoConferenceStatus.CALLING, VideoConferenceStatus.STARTED] }, endedAt: { $exists: false } },
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
	 * Rings a set of members: the in-product ring, the desktop notification, and the record of when it happened.
	 *
	 * That record is what lets a client tell a phone ringing now from one rung and ignored.
	 */
	private async ringUsers(callId: VideoConference['_id'], rid: IRoom['_id'], uid: IUser['_id'], memberIds: IUser['_id'][]): Promise<void> {
		memberIds.forEach((memberId) => this.notifyUser(memberId, 'ring', { callId, rid, uid }));
		await VideoConferenceModel.setUsersRingingById(callId, memberIds);
		this.notifyConferenceUpdate(callId);
		this.notifyVideoConfUpdate(rid, callId);

		// The ring only reaches a client that is on screen, and it is one-shot. A desktop notification is what
		// reaches someone who isn't looking at the app.
		await this.notifyUsersAddedToConference(uid, memberIds, callId, rid);
	}

	/**
	 * Rings the other side of a direct call when its caller arrives in it. Says whether it rang.
	 *
	 * Creating a call is not asking anyone to answer it — the caller is still on the preflight screen. Only
	 * members never rung before, so a rejoin rings nobody again.
	 */
	private async ringCalleeOnCallerArrival(call: IDirectVideoConference, uid: IUser['_id']): Promise<boolean> {
		if (call.createdBy._id !== uid) {
			return false;
		}

		const absent = call.users.filter((user) => user._id !== uid && isUnaskedConferenceMember(user));
		if (!absent.length) {
			return false;
		}

		await this.ringUsers(
			call._id,
			call.rid,
			uid,
			absent.map(({ _id }) => _id),
		);

		// The in-product ring only reaches a client that is on screen; a direct call is also worth a push.
		await Promise.all(absent.map(({ _id }) => this.sendPushNotification(call, _id)));

		return true;
	}

	/**
	 * Records that a member left, and ends the conference once nobody is left in it.
	 *
	 * Leaving is neither declining nor un-joining: the member keeps their history entry and can rejoin. The
	 * ending waits out a grace period, because `pagehide` cannot tell a reload from a close.
	 */
	public async leaveCall(uid: IUser['_id'], callId: VideoConference['_id']): Promise<void> {
		const call = await VideoConferenceModel.findOneById(callId, {
			projection: { rid: 1, users: 1, endedAt: 1, providerName: 1, createdBy: 1 },
		});
		if (!call || call.endedAt) {
			return;
		}

		// Leaving is reported more than once by design, so re-stamping would move a departure that already
		// happened and announce a roster change that did not.
		const member = call.users.find(({ _id }) => _id === uid);
		if (!member || member.leftAt) {
			return;
		}

		const leftAt = new Date();
		await VideoConferenceModel.setUserLeftById(callId, uid, leftAt);
		this.notifyVideoConfUpdate(call.rid, callId);
		this.notifyConferenceUpdate(callId);

		// The leaver's own devices only: a room-wide 'end' would dismiss everyone else's popup mid-call.
		if (this.runsInOurCallWindow(call.providerName)) {
			this.notifyUser(uid, 'end', { callId: call._id, rid: call.rid, uid: call.createdBy._id });
		}

		if (this.isEmbeddedProvider(call.providerName)) {
			// Out of the call, so back to whatever status they had before it. Only embedded joins claim busy,
			// so only they have a claim to end.
			await this.releaseBusyForCall(uid);
		}

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
	 * Marks the user busy for the duration of the call, without discarding the status they chose.
	 *
	 * A claim rather than a status: the one it displaces is stashed and handed back when the claim ends. Keyed
	 * by id so it nests with a voice call's own claim. Never allowed to fail a join.
	 */
	private async claimBusyForCall(uid: IUser['_id']): Promise<void> {
		try {
			const user = await Users.findOneById(uid, { projection: { language: 1 } });
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

	/** A no-op if something with a stronger claim has taken over since. */
	private async releaseBusyForCall(uid: IUser['_id']): Promise<void> {
		try {
			await Presence.endActiveState(uid, this.name);
		} catch (err) {
			logger.warn({ msg: 'Failed to restore a user status after a call', uid, err });
		}
	}

	/**
	 * Renews a member's presence lease — their call window saying it is still in the call.
	 *
	 * A renewal also revives a departure that was inferred rather than reported, undoing what the sweep did to
	 * their busy claim and to the roster. An ordinary renewal writes nothing anyone can see.
	 */
	public async renewPresence(uid: IUser['_id'], callId: VideoConference['_id']): Promise<void> {
		// Revival is decided in the same atomic step as the write. A separate read would race a reported leave,
		// and could call a heartbeat against an ended call a revival — re-claiming busy with no release left.
		const renewal = await VideoConferenceModel.renewUserPresenceById(callId, uid, new Date(), INFERRED_LEAVE_REASONS);

		// Nothing matched (the call ended, the member is unknown, or they reported leaving) or nothing was
		// revived: nothing to undo, so no side effects at all.
		if (!renewal?.revived) {
			return;
		}

		if (this.isEmbeddedProvider(renewal.providerName)) {
			await this.claimBusyForCall(uid);
		}
		this.notifyConferenceUpdate(callId);
		this.notifyVideoConfUpdate(renewal.rid, callId);
	}

	/**
	 * Marks everyone whose presence lease has run out as having left, and ends the calls that empties.
	 *
	 * Callers must check `isPresenceSweepDue` first: right after a restart every lease reads as expired whether
	 * or not anyone actually left.
	 */
	public async expirePresenceLeases(now = new Date()): Promise<void> {
		for await (const call of VideoConferenceModel.findActiveWithMembers()) {
			try {
				// The provider's capability, deliberately, and not `runsInOurCallWindow`: the setting says what a
				// call opened *now* would do, and the sweep meets calls opened before it — one created while the
				// window was off never heartbeats, so reading the setting here would end a call still running in
				// Jitsi three minutes after an admin toggled it. See [the feature
				// doc](../../../../../docs/features/video-conference-persistent-chat/README.md#knowing-who-is-still-in-the-call).
				if (!videoConfProviders.getProviderCapabilities(call.providerName)?.embedded) {
					continue;
				}

				const expired = expiredPresenceLeases(call.users, now);
				if (!expired.length) {
					continue;
				}

				for (const { uid, leftAt } of expired) {
					logger.info({ msg: 'Presence lease expired', callId: call._id, uid, leftAt });
					await VideoConferenceModel.setUserLeftById(call._id, uid, leftAt, 'timeout');
					// Whoever stopped renewing is not in a call any more, whatever their client failed to say — and a
					// status left on busy by a crashed tab is exactly the kind of thing nobody thinks to fix by hand.
					await this.releaseBusyForCall(uid);
				}

				this.notifyVideoConfUpdate(call.rid, call._id);
				this.notifyConferenceUpdate(call._id);

				// No second grace period: the lease *was* the grace period, and it is far longer than the one a
				// reported departure gets. Anyone who came back renewed it and is not in `expired` at all.
				const remaining = call.users.filter(({ _id }) => !expired.some((lease) => lease.uid === _id));
				if (!remaining.some(isInVideoConference)) {
					await this.endCall(call._id);
				}
			} catch (err) {
				// One malformed call must not stop the sweep for every other call.
				logger.error({ msg: 'Failed to expire presence leases for a conference', callId: call._id, err });
			}
		}
	}

	/** A rejoin inside the grace period is what cancels the ending. */
	private async endCallIfEmpty(callId: VideoConference['_id']): Promise<void> {
		const call = await VideoConferenceModel.findOneById(callId, { projection: { users: 1, endedAt: 1 } });
		if (!call || call.endedAt || call.users.some(isInVideoConference)) {
			return;
		}

		await this.endCall(callId);
	}

	/**
	 * Where the conference's chat lives, which members cannot read it, and what remedy is available.
	 *
	 * Conference membership grants no room access, so surfacing the members without it is the point.
	 */
	public async getChatAccess(uid: IUser['_id'], callId: VideoConference['_id']): Promise<VideoConferenceChatAccess> {
		return (await this.resolveChatAccess(uid, callId)).access;
	}

	/**
	 * `getChatAccess`, plus the usernames of the members it decided about.
	 *
	 * The public shape carries ids, which is what a client matches against; a room invite needs usernames.
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
	 * The members who cannot read the given room.
	 *
	 * Rooms whose access can come from outside their own subscriptions — team-owned, discussions, ABAC — are
	 * asked once per member. Everything else reduces to a single `Subscriptions` read.
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
	 * Names a running group conference.
	 *
	 * Only the creator may: a title anyone in the call could rewrite is one nobody can rely on. A direct call is
	 * named after the other person, so there is nothing to set.
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
		// Both streams: the room's message block shows the name, and so does the call window, which watches the
		// conference rather than the room it started in.
		this.notifyConferenceUpdate(callId);
		this.notifyVideoConfUpdate(call.rid, callId);
	}

	/**
	 * Gives the members who cannot read the chat access to it. Returns the room the chat now lives in.
	 *
	 * Both remedies give something away, so the caller names one and nothing here infers it.
	 */
	public async shareChatWithMembers(
		uid: IUser['_id'],
		callId: VideoConference['_id'],
		mode: VideoConferenceChatAccessMode,
	): Promise<IRoom['_id']> {
		const {
			access: { rid, membersWithoutAccess, canInvite },
			usernamesWithoutAccess: usernames,
		} = await this.resolveChatAccess(uid, callId);
		if (!membersWithoutAccess.length) {
			return rid;
		}

		const resolved = resolveChatAccessMode({ mode, canInvite });
		if (!resolved) {
			throw new Error('error-not-allowed');
		}

		if (resolved === 'discussion') {
			// The same rules regular discussion creation enforces: this path calls `createRoom` directly, so
			// nothing downstream would ask. A refusal, not a fallback to inviting — see `resolveChatAccessMode`.
			if (
				!settings.get<boolean>('Discussion_enabled') ||
				!(await hasAtLeastOnePermissionAsync(uid, ['start-discussion', 'start-discussion-other-user'], rid))
			) {
				throw new Error('error-not-allowed');
			}

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

	private async updateDirectCall(call: IDirectVideoConference, newUserId: IUser['_id'], { pushed = false } = {}): Promise<void> {
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

		// Unless the callee's phone has just been pushed by the ring on the caller's arrival: this is that same
		// arrival, so the bulk push would be the second notification about one call in as many moments.
		if (!pushed) {
			await this.sendAllPushNotifications(call._id);
		}
	}

	private isPersistentChatEnabled(): boolean {
		// Persistent chat discussions are always created unencrypted, so persistent chat is treated as disabled
		// while the workspace enforces encryption on private rooms.
		const encryptionEnforced = settings.get<boolean>('E2E_Enable') && settings.get<boolean>('E2E_Force_Encryption_For_Private_Rooms');

		return settings.get<boolean>('VideoConf_Enable_Persistent_Chat') && settings.get<boolean>('Discussion_enabled') && !encryptionEnforced;
	}

	/**
	 * Where a call's persistent chat lives.
	 *
	 * Only the call window gives a mode other than `main_room` anything to mean — a thread off the call message
	 * is what its chat panel is built around — so with the window off this answers `main_room` whatever the
	 * setting was left at.
	 */
	private getPersistentChatMode(): 'thread' | 'main_room' {
		if (!settings.get<boolean>('VideoConf_Conference_Window_Enabled')) {
			return 'main_room';
		}

		return (settings.get<string>('VideoConf_Persistent_Chat_Mode') as 'thread' | 'main_room') || 'thread';
	}

	/**
	 * Whether this call's chat is a thread hanging off the call's own message in the room.
	 *
	 * Deliberately not a provider question: the chat panel is ours whoever runs the media, and an iframed
	 * provider renders inside our own page. `maybeCreateDiscussion` does still ask the provider.
	 */
	private chatLivesInAThread(): boolean {
		return this.isPersistentChatEnabled() && this.getPersistentChatMode() === 'thread';
	}

	/** Idempotent: `follow` uses `$addToSet`. */
	private async autoFollowCallThread(call: Optional<VideoConference, 'providerData'>, uid: IUser['_id']): Promise<void> {
		if (!this.chatLivesInAThread()) {
			return;
		}

		if (!call.messages.started) {
			return;
		}

		await follow({ tmid: call.messages.started, uid });
	}

	/** Only once the thread's parent message exists, for everyone who joined before it did. */
	private async autoFollowCallThreadForAllParticipants(call: VideoConference): Promise<void> {
		if (!this.chatLivesInAThread()) {
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
		if (!this.supportsPersistentChat(call.providerName)) {
			return;
		}

		await this.createDiscussionForConference(this.getDiscussionDisplayName(), call, createdBy);
	}

	private getDiscussionDisplayName(): string {
		const name = settings.get<string>('VideoConf_Persistent_Chat_Discussion_Name') || i18n.t('[date] Video Call Chat');
		const date = new Date().toISOString().substring(0, 10);

		return name.includes('[date]') ? name.replace('[date]', date) : `${date} ${name}`;
	}

	/**
	 * Moves the conference's chat to a discussion off its room, so it continues without exposing the parent
	 * room's history to the people being added.
	 */
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

		// Not the conference's `users`: that holds only people who joined the call, which is not the room's
		// membership.
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
	 * Tells people about a conference through the desktop, for when the in-product ring cannot reach them.
	 *
	 * Carries a room only when the recipient can open one: membership of the call grants no room access, and a
	 * notification that navigates nowhere is worse than one that does not try.
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

	/** Unlike a ring, this one can carry the room: they were just given access to it. */
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
				// Room members who never joined the call are included on purpose: the discussion is where they
				// catch up on a conversation that moved out from under them.
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
