import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { MediaCallActorType, MediaCallContact } from './IMediaCall';

export interface IMediaCallChannel extends IRocketChatRecord {
	callId: string;

	contractId: string;

	actorType: MediaCallActorType;

	actorId: string;

	contact: Partial<MediaCallContact>;

	role: 'caller' | 'callee';

	state: 'none' | 'ringing' | 'joining' | 'active' | 'left';

	// The moment when the user accepted the call or clicked on the join button
	joinedAt?: Date;
	// The moment when the user successfully joined the call or got bridged
	activeAt?: Date;
	// The moment when the user left the call or hanged up
	leftAt?: Date;

	localDescription?: RTCSessionDescriptionInit;
	remoteDescription?: RTCSessionDescriptionInit;

	// for rocket.chat users, acknowledged means that a client user session was reached by the signaling
	acknowledged: boolean;
}
