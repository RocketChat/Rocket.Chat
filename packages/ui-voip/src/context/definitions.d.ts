import type { UserStatus } from '@rocket.chat/core-typings';
import type { CallFeature } from '@rocket.chat/media-signaling';

export type InternalPeerInfo = {
	displayName: string;
	userId: string;
	username?: string;
	avatarUrl?: string;
	callerId?: string;
	status?: UserStatus;
};

export type ExternalPeerInfo = {
	number: string;
};

export type ConnectionState = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING';

export type PeerInfo = InternalPeerInfo | ExternalPeerInfo;

export type State = 'closed' | 'new' | 'calling' | 'ringing' | 'ongoing';

interface IBaseSession {
	state: State;
	connectionState: ConnectionState;
	peerInfo: PeerInfo | undefined;
	transferredBy: string | undefined;
	muted: boolean;
	held: boolean;
	remoteMuted: boolean;
	remoteHeld: boolean;
	startedAt?: Date;
	hidden: boolean;
	supportedFeatures: readonly CallFeature[];
}

interface IEmptySession extends IBaseSession {
	state: Extract<State, 'closed' | 'new'>;
	callId: undefined;
}

interface ICallSession extends IBaseSession {
	state: Extract<State, 'calling' | 'ringing' | 'ongoing'>;
	callId: string;
	peerInfo: PeerInfo;
}

export type SessionState = IEmptySession | ICallSession;
