import { Db } from 'mongodb';
import type {
	IDirectVideoConference,
	IRoom,
	IUser,
	VideoConferenceInstructions,
	DirectCallInstructions,
	ConferenceInstructions,
	LivechatInstructions,
	AtLeast,
	IGroupVideoConference,
	IMessage,
	IVideoConferenceMessage,
	VideoConference,
	VideoConferenceCapabilities,
} from '@rocket.chat/core-typings';
import {
	VideoConferenceStatus,
	isDirectVideoConference,
	isGroupVideoConference,
	isLivechatVideoConference,
} from '@rocket.chat/core-typings';
import type { MessageSurfaceLayout, ContextBlock } from '@rocket.chat/ui-kit';
import type { AppVideoConfProviderManager } from '@rocket.chat/apps-engine/server/managers';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { VideoConferenceRaw } from '../../../app/models/server/raw/VideoConference';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import type { IVideoConfService, VideoConferenceCreateData, VideoConferenceJoinOptions } from '../../sdk/types/IVideoConfService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { Apps } from '../../../app/apps/server';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { settings } from '../../../app/settings/server';
import { getURL } from '../../../app/utils/server';
import { videoConfProviders } from '../../lib/videoConfProviders';
import { videoConfTypes } from '../../lib/videoConfTypes';
import { api } from '../../sdk/api';

export class VideoConfService extends ServiceClassInternal implements IVideoConfService {
	protected name = 'video-conference';

	private Messages: MessagesRaw;

	private Users: UsersRaw;

	private Rooms: RoomsRaw;

	private VideoConference: VideoConferenceRaw;

	constructor(db: Db) {
		super();

		this.Users = new UsersRaw(db.collection('users'));
		this.VideoConference = new VideoConferenceRaw(db.collection('rocketchat_video_conference'));
		this.Rooms = new RoomsRaw(db.collection('rocketchat_room'));
		this.Messages = new MessagesRaw(db.collection('rocketchat_message'));
	}

	// VideoConference.create: Start a video conference using the type and provider specified as arguments
	public async create({ type, rid, createdBy, providerName, ...data }: VideoConferenceCreateData): Promise<VideoConferenceInstructions> {
		const room = await this.Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'uids' | 'name' | 'fname'>>(rid, {
			projection: { t: 1, uids: 1, name: 1, fname: 1 },
		});

		if (!room) {
			throw new Error('invalid-room');
		}

		const user = await this.Users.findOneById<IUser>(createdBy, {});
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
		return this.startGroup(providerName, user, room._id, title, data);
	}

	// VideoConference.start: Detect the desired type and provider then start a video conference using them
	public async start(caller: IUser['_id'], rid: string, title?: string): Promise<VideoConferenceInstructions> {
		const providerName = await this.getValidatedProvider();
		const type = await this.getTypeForNewVideoConference(rid);

		const data = {
			type,
			createdBy: caller,
			rid,
			providerName,
		} as VideoConferenceCreateData;

		if (data.type === 'videoconference') {
			data.title = title;
		}

		return this.create(data);
	}

	public async join(uid: IUser['_id'], callId: VideoConference['_id'], options: VideoConferenceJoinOptions): Promise<string> {
		const call = await this.VideoConference.findOneById(callId);
		if (!call) {
			throw new Error('invalid-call');
		}

		const user = await this.Users.findOneById<Pick<IUser, '_id' | 'username' | 'name' | 'avatarETag'>>(uid, {
			projection: { name: 1, username: 1, avatarETag: 1 },
		});
		if (!user) {
			throw new Error('failed-to-load-own-data');
		}

		return this.joinCall(call, user, options);
	}

	public async cancel(uid: IUser['_id'], callId: VideoConference['_id']): Promise<void> {
		const call = await this.VideoConference.findOneById(callId);
		if (!call || !isDirectVideoConference(call)) {
			throw new Error('invalid-call');
		}

		if (call.status !== VideoConferenceStatus.CALLING || call.endedBy || call.endedAt) {
			throw new Error('invalid-call-status');
		}

		const user = await this.Users.findOneById(uid);
		if (!user) {
			throw new Error('failed-to-load-own-data');
		}

		if (call.messages.started) {
			const text = TAPi18n.__('video_direct_missed', { username: call.createdBy.username as string });
			await this.Messages.setBlocksById(call.messages.started, [await this.buildMessageBlock(text)]);
		}

		await this.VideoConference.setStatusById(call._id, VideoConferenceStatus.DECLINED);
		await this.VideoConference.setEndedById(call._id, { _id: user._id, name: user.name, username: user.username });
	}

	public async get(callId: VideoConference['_id']): Promise<Omit<VideoConference, 'providerData'> | null> {
		return this.VideoConference.findOneById<Omit<VideoConference, 'providerData'>>(callId, { projection: { providerData: 0 } });
	}

	public async getUnfiltered(callId: VideoConference['_id']): Promise<VideoConference | null> {
		return this.VideoConference.findOneById(callId);
	}

	public async list(
		roomId: IRoom['_id'],
		pagination: { offset?: number; count?: number } = {},
	): Promise<PaginatedResult<{ data: VideoConference[] }>> {
		const cursor = await this.VideoConference.findAllByRoomId(roomId, pagination);

		const data = (await cursor.toArray()) as VideoConference[];
		const total = await cursor.count();

		return {
			data,
			offset: pagination.offset || 0,
			count: data.length,
			total,
		};
	}

	public async setProviderData(callId: VideoConference['_id'], data: VideoConference['providerData'] | undefined): Promise<void> {
		this.VideoConference.setProviderDataById(callId, data);
	}

	public async setEndedBy(callId: VideoConference['_id'], endedBy: IUser['_id']): Promise<void> {
		const user = await this.Users.findOneById<Required<Pick<IUser, '_id' | 'username' | 'name'>>>(endedBy, {
			projection: { username: 1, name: 1 },
		});
		if (!user) {
			throw new Error('Invalid User');
		}

		this.VideoConference.setEndedById(callId, {
			_id: user._id,
			username: user.username,
			name: user.name,
		});
	}

	public async setEndedAt(callId: VideoConference['_id'], endedAt: Date): Promise<void> {
		this.VideoConference.setEndedById(callId, undefined, endedAt);
	}

	public async setStatus(callId: VideoConference['_id'], status: VideoConference['status']): Promise<void> {
		this.VideoConference.setStatusById(callId, status);

		if (status === VideoConferenceStatus.ENDED) {
			this.endCall(callId);
		}
	}

	public async addUser(callId: VideoConference['_id'], userId: IUser['_id'], ts?: Date): Promise<void> {
		const call = await this.get(callId);
		if (!call) {
			throw new Error('Invalid video conference');
		}
		const user = await this.Users.findOneById<Required<Pick<IUser, '_id' | 'username' | 'name'>>>(userId, {
			projection: { username: 1, name: 1 },
		});
		if (!user) {
			throw new Error('Invalid User');
		}

		this.addUserToCall(call, {
			_id: user._id,
			username: user.username,
			name: user.name,
			ts: ts || new Date(),
		});
	}

	public async listProviders(): Promise<{ key: string; label: string }[]> {
		return videoConfProviders.getProviderList();
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
			const text = TAPi18n.__('video_livechat_missed', { username: call.createdBy.username as string });
			await this.Messages.setBlocksById(call.messages.started, [await this.buildMessageBlock(text)]);
		}

		await this.VideoConference.setStatusById(call._id, VideoConferenceStatus.DECLINED);
		await this.VideoConference.setEndedById(call._id);

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

	private async endCall(callId: VideoConference['_id']): Promise<void> {
		const call = await this.getUnfiltered(callId);
		if (!call) {
			return;
		}

		if (!call.endedAt) {
			await this.VideoConference.setEndedById(call._id);
		}

		switch (call.type) {
			case 'direct':
				return this.endDirectCall(call);
			case 'videoconference':
				return this.endGroupCall(call);
		}
	}

	private async endDirectCall(call: IDirectVideoConference): Promise<void> {
		if (!call.messages.ended) {
			this.createDirectCallEndedMessage(call);
		}
	}

	private async endGroupCall(call: IGroupVideoConference): Promise<void> {
		if (!call.messages.ended) {
			this.createGroupCallEndedMessage(call);
		}
	}

	private async getTypeForNewVideoConference(rid: IRoom['_id']): Promise<VideoConferenceCreateData['type']> {
		const room = await this.Rooms.findOneById<Pick<IRoom, '_id' | 't'>>(rid, {
			projection: { t: 1 },
		});

		if (!room) {
			throw new Error('invalid-room');
		}

		return videoConfTypes.getTypeForRoom(room);
	}

	private async createMessage(rid: IRoom['_id'], user: IUser, extraData: Partial<IMessage> = {}): Promise<IMessage['_id']> {
		const record = {
			msg: '',
			...extraData,
		};

		const room = await this.Rooms.findOneById(rid);

		const message = sendMessage(user, record, room, false);
		return message._id;
	}

	private async createDirectCallMessage(rid: IRoom['_id'], user: IUser): Promise<IMessage['_id']> {
		const text = TAPi18n.__('video_direct_calling', {
			username: user.username || '',
		});

		return this.createMessage(rid, user, {
			blocks: [await this.buildMessageBlock(text)],
		});
	}

	private async createGroupCallMessage(rid: IRoom['_id'], user: IUser, callId: string, title: string): Promise<IMessage['_id']> {
		const text = TAPi18n.__('video_conference_started', {
			conference: title,
			username: user.username || '',
		});

		return this.createMessage(rid, user, {
			blocks: [
				this.buildMessageBlock(text),
				{
					type: 'actions',
					appId: 'videoconf-core',
					value: title,
					elements: [
						{
							appId: 'videoconf-core',
							blockId: callId,
							actionId: 'join',
							value: title,
							type: 'button',
							text: {
								type: 'plain_text',
								text: TAPi18n.__('Join_call'),
								emoji: true,
							},
						},
					],
				},
				{
					type: 'context',
					elements: [],
				},
			],
		} as Partial<IVideoConferenceMessage>);
	}

	private async validateProvider(providerName: string): Promise<void> {
		const manager = await this.getProviderManager();
		const configured = await manager.isFullyConfigured(providerName).catch(() => false);
		if (!configured) {
			throw new Error('video-conf-provider-not-configured');
		}
	}

	private async getValidatedProvider(): Promise<string> {
		if (!videoConfProviders.hasAnyProvider()) {
			throw new Error('no-videoconf-provider-app');
		}

		const providerName = videoConfProviders.getActiveProvider();
		if (!providerName) {
			throw new Error('no-active-video-conf-provider');
		}

		await this.validateProvider(providerName);

		return providerName;
	}

	private async createEphemeralMessage(uid: string, rid: string, i18nKey: string): Promise<void> {
		const user = await this.Users.findOneById<Pick<IUser, 'language' | 'roles'>>(uid, { projection: { language: 1, roles: 1 } });
		const language = user?.language || settings.get<string>('Language') || 'en';
		const key = user?.roles.includes('admin') ? `admin-${i18nKey}` : i18nKey;
		const msg = TAPi18n.__(key, {
			lng: language,
		});

		api.broadcast('notify.ephemeralMessage', uid, rid, {
			msg,
		});
	}

	private async createDirectCallEndedMessage(call: IDirectVideoConference): Promise<IMessage['_id'] | undefined> {
		const user = await this.Users.findOneById(call.endedBy?._id || call.createdBy._id);
		if (!user) {
			return;
		}

		const text =
			user._id === call.endedBy?._id
				? TAPi18n.__('video_direct_ended_by', {
						username: user.username || '',
				  })
				: TAPi18n.__('video_direct_ended');

		return this.createMessage(call.rid, user, {
			blocks: [this.buildMessageBlock(text)],
		} as Partial<IVideoConferenceMessage>);
	}

	private async createGroupCallEndedMessage(call: IGroupVideoConference): Promise<IMessage['_id'] | undefined> {
		const user = await this.Users.findOneById(call.endedBy?._id || call.createdBy._id);
		if (!user) {
			return;
		}

		const text =
			user._id === call.endedBy?._id
				? TAPi18n.__('video_conference_ended_by', {
						conference: call.title,
						username: user.username || '',
				  })
				: TAPi18n.__('video_conference_ended', {
						conference: call.title,
				  });

		return this.createMessage(call.rid, user, {
			blocks: [this.buildMessageBlock(text)],
		} as Partial<IVideoConferenceMessage>);
	}

	private async createLivechatMessage(rid: IRoom['_id'], user: IUser, callId: string, url: string): Promise<IMessage['_id']> {
		const text = TAPi18n.__('video_livechat_started', {
			username: user.username || '',
		});

		return this.createMessage(rid, user, {
			blocks: [
				this.buildMessageBlock(text),
				{
					type: 'actions',
					appId: 'videoconf-core',
					blockId: callId,
					elements: [
						{
							appId: 'videoconf-core',
							blockId: callId,
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
			],
		});
	}

	private buildMessageBlock(text: string): MessageSurfaceLayout[number] {
		return {
			type: 'section',
			text: {
				type: 'plain_text',
				text,
				emoji: true,
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

		const callId = await this.VideoConference.createDirect({
			...extraData,
			rid,
			createdBy: {
				_id: user._id,
				name: user.name,
				username: user.username,
			},
			providerName,
		});
		const call = await this.getUnfiltered(callId);
		if (!call) {
			throw new Error('failed-to-create-direct-call');
		}

		const url = await this.generateNewUrl(call);
		this.VideoConference.setUrlById(callId, url);

		const messageId = await this.createDirectCallMessage(rid, user);
		this.VideoConference.setMessageById(callId, 'started', messageId);

		return {
			type: 'direct',
			callId,
			callee,
		};
	}

	private async startGroup(
		providerName: string,
		user: IUser,
		rid: IRoom['_id'],
		title: string,
		extraData?: Partial<IGroupVideoConference>,
	): Promise<ConferenceInstructions> {
		const callId = await this.VideoConference.createGroup({
			...extraData,
			rid,
			title,
			createdBy: {
				_id: user._id,
				name: user.name,
				username: user.username,
			},
			providerName,
		});
		const call = await this.getUnfiltered(callId);
		if (!call) {
			throw new Error('failed-to-create-group-call');
		}

		const url = await this.generateNewUrl(call);
		this.VideoConference.setUrlById(callId, url);

		call.url = url;

		const messageId = await this.createGroupCallMessage(rid, user, callId, title);
		this.VideoConference.setMessageById(callId, 'started', messageId);

		return {
			type: 'videoconference',
			callId,
		};
	}

	private async startLivechat(providerName: string, user: IUser, rid: IRoom['_id']): Promise<LivechatInstructions> {
		const callId = await this.VideoConference.createLivechat({
			rid,
			createdBy: {
				_id: user._id,
				name: user.name,
				username: user.username,
			},
			providerName,
		});

		const call = await this.getUnfiltered(callId);
		if (!call) {
			throw new Error('failed-to-create-livechat-call');
		}

		const joinUrl = await this.getUrl(call);
		const messageId = await this.createLivechatMessage(rid, user, callId, joinUrl);
		await this.VideoConference.setMessageById(callId, 'started', messageId);

		return {
			type: 'livechat',
			callId,
		};
	}

	private async joinCall(
		call: VideoConference,
		user: AtLeast<IUser, '_id' | 'username' | 'name' | 'avatarETag'>,
		options: VideoConferenceJoinOptions,
	): Promise<string> {
		switch (call.type) {
			case 'direct':
				await this.joinDirectCall(call, user);
				break;
			case 'videoconference':
				await this.joinGroupCall(call, user);
				break;
		}

		return this.getUrl(call, user, options);
	}

	private async joinDirectCall(call: IDirectVideoConference, user: AtLeast<IUser, '_id' | 'username' | 'name'>): Promise<void> {
		await this.addUserToCall(call, user);

		if (call.status === VideoConferenceStatus.CALLING) {
			await this.VideoConference.setStatusById(call._id, VideoConferenceStatus.STARTED);
		}

		if (call.messages.started) {
			const text = TAPi18n.__('video_direct_started', { username: call.createdBy.username || '' });
			await this.Messages.setBlocksById(call.messages.started, [await this.buildMessageBlock(text)]);
		}
	}

	private async joinGroupCall(call: IGroupVideoConference, user: AtLeast<IUser, '_id' | 'username' | 'name'>): Promise<void> {
		await this.addUserToCall(call, user);

		if (!call.messages.started || !user.username) {
			return;
		}

		const message = await this.Messages.findOneById<IMessage>(call.messages.started, {});
		if (!message) {
			return;
		}

		const blocks = message.blocks || [];

		const avatarsBlock = (blocks.find((block) => block.type === 'context') || { type: 'context', elements: [] }) as ContextBlock;
		if (!blocks.includes(avatarsBlock)) {
			blocks.push(avatarsBlock);
		}

		const imageUrl = getURL(`/avatar/${user.username}`, { cdn: false, full: true });

		if (avatarsBlock.elements.find((el) => el.type === 'image' && el.imageUrl === imageUrl)) {
			return;
		}

		avatarsBlock.elements = [
			...avatarsBlock.elements,
			{
				type: 'image',
				imageUrl,
				altText: user.name || user.username,
			},
		];

		await this.Messages.setBlocksById(call.messages.started, blocks);
	}

	private async getProviderManager(): Promise<AppVideoConfProviderManager> {
		if (!Apps?.isLoaded()) {
			throw new Error('apps-engine-not-loaded');
		}

		const manager = Apps.getManager()?.getVideoConfProviderManager();
		if (!manager) {
			throw new Error('no-videoconf-provider-app');
		}

		return manager;
	}

	private async getRoomName(rid: string): Promise<string> {
		const room = await this.Rooms.findOneById<Pick<IRoom, '_id' | 'name' | 'fname'>>(rid, { projection: { name: 1, fname: 1 } });

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
			this.VideoConference.setUrlById(call._id, call.url);
		}

		const callData = {
			_id: call._id,
			type: call.type,
			rid: call.rid,
			url: call.url,
			createdBy: call.createdBy as Required<VideoConference['createdBy']>,
			providerData: call.providerData,
			...(isGroupVideoConference(call) ? { title: call.title } : {}),
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

	private async addUserToCall(
		call: AtLeast<VideoConference, '_id' | 'users'>,
		{ _id, username, name, avatarETag, ts }: AtLeast<IUser, '_id' | 'username' | 'name' | 'avatarETag'> & { ts?: Date },
	): Promise<void> {
		if (call.users.find((user) => user._id === _id)) {
			return;
		}

		return this.VideoConference.addUserById(call._id, { _id, username, name, avatarETag, ts });
	}
}
