import { Db } from 'mongodb';
import type {
	IRoom,
	IUser,
	IVideoConference,
	VideoConferenceInstructions,
	DirectCallInstructions,
	ConferenceInstructions,
	AtLeast,
	IMessage,
	IVideoConferenceMessage,
} from '@rocket.chat/core-typings';
import { VideoConferenceStatus, isDirectVideoConference, isGroupVideoConference } from '@rocket.chat/core-typings';
import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { VideoConferenceRaw } from '../../../app/models/server/raw/VideoConference';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import type { IVideoConfService, VideoConferenceJoinOptions } from '../../sdk/types/IVideoConfService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';

// This class is only here for testing, this code will be handled by apps
class JitsiApp {
	static async generateUrl(callId: IVideoConference['_id']): Promise<string> {
		return `https://jitsi.rocket.chat/${callId}`;
	}

	static async customizeUrl(
		call: IVideoConference,
		user: AtLeast<IUser, '_id' | 'username' | 'name'>,
		options: VideoConferenceJoinOptions,
	): Promise<string> {
		const configs = [`userInfo.displayName="${user.name}"`, `config.prejoinPageEnabled=false`, `config.requireDisplayName=false`];

		if (isGroupVideoConference(call)) {
			configs.push(`config.callDisplayName="${call.title || 'Video Conference'}"`);
		} else {
			configs.push(`config.callDisplayName="Direct Message"`);
		}

		if (options.mic !== undefined) {
			configs.push(`config.startWithAudioMuted=${options.mic ? 'false' : 'true'}`);
		}
		if (options.cam !== undefined) {
			configs.push(`config.startWithVideoMuted=${options.cam ? 'false' : 'true'}`);
		}
		console.log(user.username, options, configs);

		const configHash = configs.join('&');
		const url = `${call.url}#${configHash}`;

		return url;
	}
}

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

	public async start(caller: IUser['_id'], rid: string, title?: string): Promise<VideoConferenceInstructions> {
		const room = await this.Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'uids' | 'name' | 'fname'>>(rid, {
			projection: { t: 1, uids: 1, name: 1, fname: 1 },
		});

		if (!room) {
			throw new Error('invalid-room');
		}

		if (room.t === 'd' && room.uids && room.uids.length <= 2) {
			return this.startDirect(caller, room);
		}

		return this.startGroup(caller, room._id, title || room.fname || room.name || '');
	}

	public async join(uid: IUser['_id'], callId: IVideoConference['_id'], options: VideoConferenceJoinOptions): Promise<string> {
		const call = await this.VideoConference.findOneById(callId);
		if (!call) {
			throw new Error('invalid-call');
		}

		const user = await this.Users.findOneById<Pick<IUser, '_id' | 'username' | 'name'>>(uid, { projection: { name: 1, username: 1 } });
		if (!user) {
			throw new Error('failed-to-load-own-data');
		}

		return this.joinCall(call, user, options);
	}

	public async cancel(uid: IUser['_id'], callId: IVideoConference['_id']): Promise<void> {
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

		await this.VideoConference.setEndedById(call._id, { _id: user._id, name: user.name, username: user.username });
	}

	public async get(callId: IVideoConference['_id']): Promise<IVideoConference | null> {
		return this.VideoConference.findOneById(callId);
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
			],
		} as Partial<IVideoConferenceMessage>);
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

	private async startDirect(caller: IUser['_id'], { _id: rid, uids }: AtLeast<IRoom, '_id' | 'uids'>): Promise<DirectCallInstructions> {
		const callee = uids?.filter((uid) => uid !== caller).pop();
		if (!callee) {
			// Are you trying to call yourself?
			throw new Error('invalid-call-target');
		}

		const user = await this.Users.findOneById<IUser>(caller, {});
		if (!user) {
			throw new Error('failed-to-load-own-data');
		}

		const callId = await this.VideoConference.createDirect(rid, {
			_id: user._id,
			name: user.name,
			username: user.username,
		});

		const url = await this.generateNewUrl(callId);
		this.VideoConference.setUrlById(callId, url);

		const messageId = await this.createDirectCallMessage(rid, user);
		this.VideoConference.setMessageById(callId, 'started', messageId);

		return {
			type: 'direct',
			callId,
			callee,
		};
	}

	private async startGroup(caller: IUser['_id'], rid: IRoom['_id'], title: string): Promise<ConferenceInstructions> {
		const user = await this.Users.findOneById<IUser>(caller, {});
		if (!user) {
			throw new Error('failed-to-load-own-data');
		}

		const callId = await this.VideoConference.createGroup(rid, title, {
			_id: user._id,
			name: user.name,
			username: user.username,
		});

		const url = await this.generateNewUrl(callId);
		this.VideoConference.setUrlById(callId, url);

		const messageId = await this.createGroupCallMessage(rid, user, callId, title);
		this.VideoConference.setMessageById(callId, 'started', messageId);

		return {
			type: 'videoconference',
			callId,
		};
	}

	private async joinCall(
		call: IVideoConference,
		user: AtLeast<IUser, '_id' | 'username' | 'name'>,
		options: VideoConferenceJoinOptions,
	): Promise<string> {
		const url = this.getUrl(call, user, options);

		if (!call.users.find(({ _id }) => _id === user._id)) {
			await this.addUserToCall(call, user);
		}

		return url;
	}

	private async generateNewUrl(callId: IVideoConference['_id']): Promise<string> {
		// #ToDo: Load this from the Apps-Engine
		return JitsiApp.generateUrl(callId);
	}

	private async getUrl(
		call: IVideoConference,
		user: AtLeast<IUser, '_id' | 'username' | 'name'>,
		options: VideoConferenceJoinOptions,
	): Promise<string> {
		if (!call.url) {
			call.url = await this.generateNewUrl(call._id);
			this.VideoConference.setUrlById(call._id, call.url);
		}

		// #ToDo: Load this from the Apps-Engine
		return JitsiApp.customizeUrl(call, user, options);
	}

	private async addUserToCall(call: IVideoConference, { _id, username, name }: AtLeast<IUser, '_id' | 'username' | 'name'>): Promise<void> {
		await this.VideoConference.addUserById(call._id, { _id, username, name });

		if (call.type !== 'direct') {
			// #ToDo: Add user avatar to the "started" message blocks
		}
	}
}
