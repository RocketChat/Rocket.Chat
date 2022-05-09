import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';
import type { IMessage } from './IMessage';
import type { ValueOf } from './utils';

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

export const VideoConferenceStatus = {
	CALLING: 0,
	STARTED: 1,
	ENDED: 2,
} as const;

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
	status: ValueOf<typeof VideoConferenceStatus>;

	createdBy: Pick<IUser, '_id' | 'username' | 'name'>;
	createdAt: Date;

	endedBy: Pick<IUser, '_id' | 'username' | 'name'>;
	endedAt: Date;
}

export type VideoConferenceInstructions = DirectCallInstructions | ConferenceInstructions;
