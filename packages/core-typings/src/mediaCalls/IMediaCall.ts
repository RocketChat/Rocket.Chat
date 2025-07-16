import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { IUser } from '../IUser';

export type MediaCallActor =
	| {
			type: 'user';
			uid: IUser['_id'];
			sessionId?: string;
	  }
	| {
			type: 'sip';
			username: string;
	  }
	| { type: 'server' };

export interface IMediaCall extends IRocketChatRecord {
	service: 'webrtc';
	kind: 'direct';

	rid?: string;
	state: 'none' | 'dialing' | 'accepted' | 'active' | 'hangup';

	createdBy: MediaCallActor;
	createdAt: Date;

	caller: MediaCallActor;
	callee: MediaCallActor;

	endedBy?: MediaCallActor;
	endedAt?: Date;

	userChannels: MediaCallUserChannel[];

	// providerName: string;
	// providerData?: Record<string, any>;
}

export type MediaCallChannelUserRC = {
	type: 'user';
	uid: IUser['_id'];
	username: string;
	displayName?: string;

	sessionId: string;
};

export type MediaCallChannelUserSIP = {
	type: 'sip';
	// The SIP username usually matches the extension number
	username: string;
};

export type MediaCallParticipant = MediaCallChannelUserRC | MediaCallChannelUserSIP;

export type MediaCallChannel = {
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
};

export type MediaCallUserChannel = MediaCallChannel & {
	participant: MediaCallChannelUserRC;
};

export type MediaCallSipChannel = MediaCallChannel & {
	participant: MediaCallChannelUserSIP;
};

export type MediaCallExternalChannel = MediaCallSipChannel;
