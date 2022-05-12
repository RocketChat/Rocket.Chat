import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';
import type { IMessage } from './IMessage';

export type DirectCallInstructions = {
	type: 'direct';
	callee: IUser['_id'];
	callId: string;
};

export type ConferenceInstructions = {
	type: 'videoconference';
	callId: string;
};

export type VideoConferenceType = DirectCallInstructions['type'] | ConferenceInstructions['type'];
export interface IVideoConferenceUser extends Pick<IUser, '_id' | 'username' | 'name'> {
	ts: Date;
}

export enum VideoConferenceStatus {
	CALLING = 0,
	STARTED = 1,
	ENDED = 2,
}

export interface IVideoConference extends IRocketChatRecord {
	type: VideoConferenceType;
	rid: string;
	users: IVideoConferenceUser[];
	status: VideoConferenceStatus;
	messages: {};
	url?: string;

	createdBy: Pick<IUser, '_id' | 'username' | 'name'>;
	createdAt: Date;

	endedBy?: Pick<IUser, '_id' | 'username' | 'name'>;
	endedAt?: Date;
}

export interface IDirectVideoConference extends IVideoConference {
	type: 'direct';

	messages: {
		calling?: IMessage['_id'];
		missed?: IMessage['_id'];
		started?: IMessage['_id'];
		ended?: IMessage['_id'];
	};
}

export interface IGroupVideoConference extends IVideoConference {
	type: 'videoconference';
	anonymousUsers: number;
	title: string;

	messages: {
		started?: IMessage['_id'];
		ended?: IMessage['_id'];
	};
}

export type VideoConferenceInstructions = DirectCallInstructions | ConferenceInstructions;
