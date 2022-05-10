import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

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

export interface IVideoConference extends IRocketChatRecord {
	type: VideoConferenceType;
	users: Pick<IUser, '_id' | 'username' | 'name'>[];
	rid: string;

	_createdBy: Pick<IUser, '_id' | 'username' | 'name'>;
	_createdAt: Date;
}

export type VideoConferenceInstructions = DirectCallInstructions | ConferenceInstructions;
