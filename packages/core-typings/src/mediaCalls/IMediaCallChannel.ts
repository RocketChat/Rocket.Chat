import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { IUser } from '../IUser';

export type MediaCallParticipantIdentification = {
	type: 'user' | 'sip';
	id: string;
	sessionId?: string;
};

export type MediaCallChannelUserRC = MediaCallParticipantIdentification & {
	type: 'user';
	id: IUser['_id'];
	username: string;
	displayName?: string;

	sessionId: string;
};

export type MediaCallChannelUserSIP = MediaCallParticipantIdentification & {
	type: 'sip';
	id: string;
	sessionId?: never;

	// The SIP username usually matches the extension number
	username: string;
};

export type MediaCallParticipant = MediaCallChannelUserRC | MediaCallChannelUserSIP;

export interface IMediaCallChannel extends IRocketChatRecord {
	callId: string;

	participant: MediaCallParticipant;

	role: 'caller' | 'callee' | 'none';

	state: 'none' | 'ringing' | 'joining' | 'active' | 'left';

	// The moment when the user accepted the call or clicked on the join button
	joinedAt?: Date;
	// The moment when the user successfully joined the call or got bridged
	activeAt?: Date;
	// The moment when the user left the call or hanged up
	leftAt?: Date;

	webrtc?: {
		local: {
			description: RTCSessionDescriptionInit | null;
			iceCandidates: RTCIceCandidateInit[];
			iceGatheringComplete: boolean;
		};
		remote: {
			description: RTCSessionDescriptionInit | null;
			iceCandidates: RTCIceCandidateInit[];
			iceGatheringComplete: boolean;
		};
	};
}
