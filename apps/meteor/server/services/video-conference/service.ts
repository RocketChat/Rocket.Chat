import { MongoInternals } from 'meteor/mongo';
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
} from '@rocket.chat/core-typings';
import {
	VideoConferenceStatus,
	isDirectVideoConference,
	isGroupVideoConference,
	isLivechatVideoConference,
} from '@rocket.chat/core-typings';
import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import type { AppVideoConfProviderManager } from '@rocket.chat/apps-engine/server/managers';
import type { IBlock } from '@rocket.chat/apps-engine/definition/uikit';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import { Users, VideoConference as VideoConferenceModel, Rooms, Messages, Subscriptions } from '@rocket.chat/models';

import type { IVideoConfService, VideoConferenceJoinOptions } from '../../sdk/types/IVideoConfService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { Apps } from '../../../app/apps/server';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { settings } from '../../../app/settings/server';
import { videoConfProviders } from '../../lib/videoConfProviders';
import { videoConfTypes } from '../../lib/videoConfTypes';
import { updateCounter } from '../../../app/statistics/server/functions/updateStatsCounter';
import { api } from '../../sdk/api';
import { readSecondaryPreferred } from '../../database/readSecondaryPreferred';
import { availabilityErrors } from '../../../lib/videoConference/constants';
import { callbacks } from '../../../lib/callbacks';
import { Notifications } from '../../../app/notifications/server';
import { canAccessRoomIdAsync } from '../../../app/authorization/server/functions/canAccessRoom';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

export class VideoConfService extends ServiceClassInternal implements IVideoConfService {
	protected name = 'video-conference';

	// VideoConference.create: Start a video conference using the type and provider specified as arguments
	public async create(
		{ type, rid, createdBy, providerName, ...data }: VideoConferenceCreateData,
		useAppUser = true,
	): Promise<VideoConferenceInstructions> {
		const room = await Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'uids' | 'name' | 'fname'>>(rid, {
			projection: { t: 1, uids: 1, name: 1, fname: 1 },
		});

		if (!room) {
			throw new Error('invalid-room');
		}

		const user = await Users.findOneById<IUser>(createdBy, {});
		if (!user) {
			throw new Error('failed-to-load-own-data');
		}

		if (type === 'direct') {
			if (room.t !== 'd' || !room.uids || room.uids.length > 2) {
				throw new Error('type-and-room-not-compatible');
			}

			return this.startDirect(providerName, user, room, data);
		}

		if (type === 'livechat') {
			return this.startLivechat(providerName, user, rid);
		}

		const title = (data as Partial<IGroupVideoConference>).title || room.fname || room.name || '';
		return this.startGroup(providerName, user, room._id, title, data, useAppUser);
	}

	// VideoConference.start: Detect the desired type and provider then start a video conference using them
	public async start(
		caller: IUser['_id'],
		rid: string,
		{ title, allowRinging }: { title?: string; allowRinging?: boolean },
	): Promise<VideoConferenceInstructions> {
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
	}

	public async join(uid: IUser['_id'] | undefined, callId: VideoConference['_id'], options: VideoConferenceJoinOptions): Promise<string> {
		const call = await VideoConferenceModel.findOneById(callId);
		if (!call || call.endedAt) {
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
	}

	public async getInfo(callId: VideoConference['_id'], uid: IUser['_id'] | undefined): Promise<IBlock[]> {
		const call = await VideoConferenceModel.findOneById(callId);
		if (!call) {
			throw new Error('invalid-call');
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
			return blocks;
		}

		return [
			{
				blockId: 'videoconf-info',
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `**${TAPi18n.__('Video_Conference_Url')}**: ${call.url}`,
				},
			} as IBlock,
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
		VideoConferenceModel.setProviderDataById(callId, data);
	}

	public async setEndedBy(callId: VideoConference['_id'], endedBy: IUser['_id']): Promise<void> {
		const user = await Users.findOneById<Required<Pick<IUser, '_id' | 'username' | 'name'>>>(endedBy, {
			projection: { username: 1, name: 1 },
		});
		if (!user) {
			throw new Error('Invalid User');
		}

		VideoConferenceModel.setEndedById(callId, {
			_id: user._id,
			username: user.username,
			name: user.name,
		});
	}

	public async setEndedAt(callId: VideoConference['_id'], endedAt: Date): Promise<void> {
		VideoConferenceModel.setEndedById(callId, undefined, endedAt);
	}

	public async setStatus(callId: VideoConference['_id'], status: VideoConference['status']): Promise<void> {
		switch (status) {
			case VideoConferenceStatus.ENDED:
				return this.endCall(callId);
			case VideoConferenceStatus.EXPIRED:
				return this.expireCall(callId);
		}

		VideoConferenceModel.setStatusById(callId, status);
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

		this.addUserToCall(call, {
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
			const text = TAPi18n.__('video_livechat_missed', { username: name });
			await Messages.setBlocksById(call.messages.started, [this.buildMessageBlock(text)]);
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
				this.createEphemeralMessage(uid, rid, error.message);
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
				Notifications.notifyUser(call.createdBy._id, 'video-conference.end', { rid, uid, callId });
			}

			return false;
		}

		return true;
	}

	private notifyVideoConfUpdate(rid: IRoom['_id'], callId: VideoConference['_id']): void {
		Notifications.notifyRoom(rid, callId);
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
		Notifications.notifyUser(call.createdBy._id, 'video-conference.end', params);

		// If the callee hasn't joined the call yet, notify them that it has already ended
		const subscriptions = await Subscriptions.findByRoomIdAndNotUserId(call.rid, call.createdBy._id, {
			projection: { 'u._id': 1, '_id': 0 },
		}).toArray();

		for (const subscription of subscriptions) {
			if (call.users.find(({ _id }) => _id === subscription.u._id)) {
				continue;
			}

			Notifications.notifyUser(subscription.u._id, 'video-conference.end', params);
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
		};

		const room = await Rooms.findOneById(call.rid);
		const appId = videoConfProviders.getProviderAppId(call.providerName);
		const user = createdBy || (appId && (await Users.findOneByAppId(appId))) || (await Users.findOneById('rocket.cat'));

		const message = sendMessage(user, record, room, false);
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
		const msg = TAPi18n.__(key, {
			lng: language,
		});

		api.broadcast('notify.ephemeralMessage', uid, rid, {
			msg,
		});
	}

	private async createLivechatMessage(call: ILivechatVideoConference, user: IUser, url: string): Promise<IMessage['_id']> {
		const username = (settings.get<boolean>('UI_Use_Real_Name') ? user.name : user.username) || user.username || '';
		const text = TAPi18n.__('video_livechat_started', {
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
							text: TAPi18n.__('Join_call'),
							emoji: true,
						},
						url,
					},
				],
			},
		]);
	}

	private buildVideoConfBlock(callId: string): MessageSurfaceLayout[number] {
		return {
			type: 'video_conf',
			blockId: callId,
			callId,
			appId: 'videoconf-core',
		};
	}

	private buildMessageBlock(text: string): MessageSurfaceLayout[number] {
		return {
			type: 'section',
			appId: 'videoconf-core',
			text: {
				type: 'mrkdwn',
				text: `${text}`,
			},
		};
	}

	private async startDirect(
		providerName: string,
		user: IUser,
		{ _id: rid, uids }: AtLeast<IRoom, '_id' | 'uids'>,
		extraData?: Partial<IDirectVideoConference>,
	): Promise<DirectCallInstructions> {
		const callee = uids?.filter((uid) => uid !== user._id).pop();
		if (!callee) {
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
		const call = (await this.getUnfiltered(callId)) as IDirectVideoConference | null;
		if (!call) {
			throw new Error('failed-to-create-direct-call');
		}

		await this.runNewVideoConferenceEvent(callId);

		const url = await this.generateNewUrl(call);
		VideoConferenceModel.setUrlById(callId, url);

		const messageId = await this.createMessage(call, user);
		call.messages.started = messageId;
		VideoConferenceModel.setMessageById(callId, 'started', messageId);

		// After 40 seconds if the status is still "calling", we cancel the call automatically.
		setTimeout(async () => {
			try {
				const call = await VideoConferenceModel.findOneById<Pick<VideoConference, '_id' | 'status'>>(callId, { projection: { status: 1 } });

				if (call?.status !== VideoConferenceStatus.CALLING) {
					return;
				}

				await this.cancel(user._id, callId);
			} catch {
				// Ignore errors on this timeout
			}
		}, 40000);

		return {
			type: 'direct',
			callId,
			callee,
		};
	}

	private async notifyUsersOfRoom(rid: IRoom['_id'], uid: IUser['_id'], eventName: string, ...args: any[]): Promise<void> {
		const subscriptions = Subscriptions.findByRoomIdAndNotUserId(rid, uid, {
			projection: { 'u._id': 1, '_id': 0 },
		});

		await subscriptions.forEach((subscription) => Notifications.notifyUser(subscription.u._id, eventName, ...args));
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
		const call = (await this.getUnfiltered(callId)) as IGroupVideoConference | null;
		if (!call) {
			throw new Error('failed-to-create-group-call');
		}

		await this.runNewVideoConferenceEvent(callId);

		const url = await this.generateNewUrl(call);
		VideoConferenceModel.setUrlById(callId, url);

		call.url = url;

		const messageId = await this.createMessage(call, useAppUser ? undefined : user);
		call.messages.started = messageId;
		VideoConferenceModel.setMessageById(callId, 'started', messageId);

		if (call.ringing) {
			await this.notifyUsersOfRoom(rid, user._id, 'video-conference.ring', { callId, rid, title, uid: call.createdBy, providerName });
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
		call: VideoConference,
		user: AtLeast<IUser, '_id' | 'username' | 'name' | 'avatarETag'> | undefined,
		options: VideoConferenceJoinOptions,
	): Promise<string> {
		await callbacks.runAsync('onJoinVideoConference', call._id, user?._id);

		await this.runOnUserJoinEvent(call._id, user as IVideoConferenceUser);

		return this.getUrl(call, user, options);
	}

	private async getProviderManager(): Promise<AppVideoConfProviderManager> {
		if (!Apps?.isLoaded()) {
			throw new Error('apps-engine-not-loaded');
		}

		const manager = Apps.getManager()?.getVideoConfProviderManager();
		if (!manager) {
			throw new Error(availabilityErrors.NO_APP);
		}

		return manager;
	}

	private async getRoomName(rid: string): Promise<string> {
		const room = await Rooms.findOneById<Pick<IRoom, '_id' | 'name' | 'fname'>>(rid, { projection: { name: 1, fname: 1 } });

		return room?.fname || room?.name || rid;
	}

	private async generateNewUrl(call: VideoConference): Promise<string> {
		if (!videoConfProviders.isProviderAvailable(call.providerName)) {
			throw new Error('video-conf-provider-unavailable');
		}

		const title = isGroupVideoConference(call) ? call.title || (await this.getRoomName(call.rid)) : '';

		return (await this.getProviderManager())
			.generateUrl(call.providerName, {
				_id: call._id,
				type: call.type,
				rid: call.rid,
				createdBy: call.createdBy as Required<VideoConference['createdBy']>,
				title,
				providerData: call.providerData,
			})
			.catch((e) => {
				throw new Error(e);
			});
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
		call: VideoConference,
		user?: AtLeast<IUser, '_id' | 'username' | 'name'>,
		options: VideoConferenceJoinOptions = {},
	): Promise<string> {
		if (!videoConfProviders.isProviderAvailable(call.providerName)) {
			throw new Error('video-conf-provider-unavailable');
		}

		if (!call.url) {
			call.url = await this.generateNewUrl(call);
			VideoConferenceModel.setUrlById(call._id, call.url);
		}

		const callData = {
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
		};

		const userData = user && {
			_id: user._id,
			username: user.username as string,
			name: user.name as string,
		};

		return (await this.getProviderManager()).customizeUrl(call.providerName, callData, userData, options).catch((e) => {
			throw new Error(e);
		});
	}

	private async runNewVideoConferenceEvent(callId: VideoConference['_id']): Promise<void> {
		const call = await VideoConferenceModel.findOneById(callId);

		if (!call) {
			throw new Error('video-conf-data-not-found');
		}

		if (!videoConfProviders.isProviderAvailable(call.providerName)) {
			throw new Error('video-conf-provider-unavailable');
		}

		(await this.getProviderManager()).onNewVideoConference(call.providerName, call).catch((e) => {
			throw new Error(e);
		});
	}

	private async runVideoConferenceChangedEvent(callId: VideoConference['_id']): Promise<void> {
		const call = await VideoConferenceModel.findOneById(callId);

		if (!call) {
			throw new Error('video-conf-data-not-found');
		}

		if (!videoConfProviders.isProviderAvailable(call.providerName)) {
			throw new Error('video-conf-provider-unavailable');
		}

		(await this.getProviderManager()).onVideoConferenceChanged(call.providerName, call).catch((e) => {
			throw new Error(e);
		});
	}

	private async runOnUserJoinEvent(callId: VideoConference['_id'], user?: IVideoConferenceUser): Promise<void> {
		const call = await VideoConferenceModel.findOneById(callId);

		if (!call) {
			throw new Error('video-conf-data-not-found');
		}

		if (!videoConfProviders.isProviderAvailable(call.providerName)) {
			throw new Error('video-conf-provider-unavailable');
		}

		(await this.getProviderManager()).onUserJoin(call.providerName, call, user).catch((e) => {
			throw new Error(e);
		});
	}

	private async addUserToCall(
		call: Optional<VideoConference, 'providerData'>,
		{ _id, username, name, avatarETag, ts }: AtLeast<Required<IUser>, '_id' | 'username' | 'name' | 'avatarETag'> & { ts?: Date },
	): Promise<void> {
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
			Notifications.notifyUser(call.createdBy._id, 'video-conference.join', { rid: call.rid, uid: newUserId, callId: call._id });
			if (newUserId !== call.createdBy._id) {
				Notifications.notifyUser(newUserId, 'video-conference.join', { rid: call.rid, uid: newUserId, callId: call._id });
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
	}
}
