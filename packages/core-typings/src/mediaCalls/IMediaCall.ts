import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { IUser } from '../IUser';

export interface IMediaCallUserSession {
	//
}

export interface IMediaCallUser {
	uid?: IUser['_id'];

	// Might be a Rocket.Chat username, or an extension number
	username?: string;
	name?: string;

	sessions: IMediaCallUserSession[];
}

export type MediaCallParticipant = {
	type: 'user';
	user: IMediaCallUser;
};

export interface IMediaCall extends IRocketChatRecord {
	service: 'webrtc';
	kind: 'direct';

	rid?: string;
	state: 'NONE' | 'DIALING' | 'ACCEPTED' | 'ACTIVE' | 'HANGUP';

	createdBy: MediaCallParticipant;
	createdAt: Date;

	endedBy?: MediaCallParticipant;
	endedAt?: Date;

	channels: IMediaCallChannel[];

	// providerName: string;
	// providerData?: Record<string, any>;
}

export interface IMediaCallChannel {
	user?: IMediaCallUser;

	// Originator means this channel was the one who started the call
	originator?: boolean;

	state: 'NONE' | 'JOINING' | 'ACTIVE' | 'LEFT';

	// The moment when the user accepted the call or clicked on the join button
	joinedAt?: Date;
	// The moment when the user successfully joined the call or got bridged
	activeAt?: Date;
	// The moment when the user left the call or hanged up
	leftAt?: Date;
}

export interface IWebRTCMediaCall extends IMediaCall {
	service: 'webrtc';

	offer?: {
		sdp: string;
	};

	answer?: {
		sdp: string;
	};
}
