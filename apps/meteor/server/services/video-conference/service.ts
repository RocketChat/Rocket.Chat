import { Db, ObjectID } from 'mongodb';
import type {
	IRoom,
	IUser,
	IVideoConference,
	MessageTypesValues,
	VideoConferenceInstructions,
	DirectCallInstructions,
	AtLeast,
	IMessage,
} from '@rocket.chat/core-typings';
import { VideoConferenceStatus, isDirectVideoConference } from '@rocket.chat/core-typings';

import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { VideoConferenceRaw } from '../../../app/models/server/raw/VideoConference';
import { InsertionModel } from '../../../app/models/server/raw/BaseRaw';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import type { IVideoConfService, VideoConferenceJoinOptions } from '../../sdk/types/IVideoConfService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { settings } from '../../../app/settings/server';

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
		const configs = [
			`userInfo.displayName="${user.name}"`,
			`config.prejoinPageEnabled=false`,
			`config.requireDisplayName=false`,
			`config.callDisplayName="Direct Message"`,
		];

		console.log(user.username, options);
		if (options.mic !== undefined) {
			configs.push(`config.startWithAudioMuted=${options.mic ? 'true' : 'false'}`);
		}
		if (options.cam !== undefined) {
			configs.push(`config.startWithVideoMuted=${options.cam ? 'true' : 'false'}`);
		}

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

	public async start(caller: IUser['_id'], rid: string): Promise<VideoConferenceInstructions> {
		const room = await this.Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'uids'>>(rid, { projection: { t: 1, uids: 1 } });

		if (!room) {
			throw new Error('invalid-room');
		}

		if (room.t === 'd' && room.uids && room.uids.length <= 2) {
			return this.startDirect(caller, room);
		}

		throw new Error('Conferece calls have not been implemented yet.');
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

		switch (call.type) {
			case 'direct':
				return this.joinDirect(call, user, options);
		}

		throw new Error('Conferece calls have not been implemented yet.');
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
			await this.changeMessageType(call.messages.started, 'video-direct-missed');
		}

		this.VideoConference.endVideoConference(call._id, { _id: user._id, name: user.name, username: user.username });
	}

	public async get(callId: IVideoConference['_id']): Promise<IVideoConference | null> {
		return this.VideoConference.findOneById(callId);
	}

	private async createMessage(
		type: MessageTypesValues,
		rid: IRoom['_id'],
		user: IUser,
		extraData: Partial<IMessage> = {},
	): Promise<IMessage['_id']> {
		const readReceipt = settings.get('Message_Read_Receipt_Enabled');

		const record = {
			t: type,
			rid,
			ts: new Date(),
			u: {
				_id: user._id,
				username: user.username,
			},
			groupable: false,
			...(readReceipt ? { unread: true } : {}),
			...extraData,
		};

		const id = (await this.Messages.insertOne(record)).insertedId;
		this.Rooms.incMsgCountById(rid, 1);
		return id;
	}

	private async createDirectCallMessage(rid: IRoom['_id'], user: IUser): Promise<IMessage['_id']> {
		return this.createMessage('video-direct-calling', rid, user);
	}

	private async changeMessageType(messageId: string, newType: MessageTypesValues): Promise<void> {
		this.Messages.updateType(messageId, newType);
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

		const callId = new ObjectID().toHexString();
		const messageId = await this.createDirectCallMessage(rid, user);

		const call: InsertionModel<IVideoConference> = {
			_id: callId,
			type: 'direct',
			rid,
			users: [],
			messages: {
				started: messageId,
			},
			status: VideoConferenceStatus.CALLING,
			createdBy: user,
			createdAt: new Date(),
			url: await this.generateNewUrl(callId),
		};

		await this.VideoConference.insertOne(call);

		return {
			type: 'direct',
			callId,
			callee,
		};
	}

	private async joinDirect(
		call: IVideoConference,
		user: AtLeast<IUser, '_id' | 'username' | 'name'>,
		options: VideoConferenceJoinOptions,
	): Promise<string> {
		const url = this.getUrl(call, user, options);

		if (!call.users.find(({ _id }) => _id === user._id)) {
			this.addUserToCall(call._id, user);
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
			this.VideoConference.updateUrl(call._id, call.url);
		}

		// #ToDo: Load this from the Apps-Engine
		return JitsiApp.customizeUrl(call, user, options);
	}

	private async addUserToCall(
		callId: IVideoConference['_id'],
		{ _id, username, name }: AtLeast<IUser, '_id' | 'username' | 'name'>,
	): Promise<void> {
		this.VideoConference.addUserToVideoConference(callId, { _id, username, name });
	}
}
