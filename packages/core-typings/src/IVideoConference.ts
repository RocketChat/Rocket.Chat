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
export interface IVideoConferenceUser extends Required<Pick<IUser, '_id' | 'username' | 'name'>> {
	ts: Date;
}

export enum VideoConferenceStatus {
	CALLING = 0,
	STARTED = 1,
	ENDED = 2,
}

export interface IVideoConference extends IRocketChatRecord {
	type: VideoConferenceType;
	users: IVideoConferenceUser[];
	rid: string;
	anonymousUsers: number;
	title: string;
	messages: {
		calling?: IMessage['_id'];
		missed?: IMessage['_id'];
		started?: IMessage['_id'];
		ended?: IMessage['_id'];
	};
	status: VideoConferenceStatus;
	url?: string;

	createdBy: Required<Pick<IUser, '_id' | 'username' | 'name'>>;
	createdAt: Date;

	endedBy?: Required<Pick<IUser, '_id' | 'username' | 'name'>>;
	endedAt?: Date;
}

export type VideoConferenceInstructions = DirectCallInstructions | ConferenceInstructions;
