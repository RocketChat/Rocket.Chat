import type { UserStatus } from '@rocket.chat/core-typings';
import type { CallFeature } from '@rocket.chat/media-signaling';

export type InternalPeerInfo = {
	type: 'sip' | 'user';
	displayName: string;
	userId: string;
	username?: string;
	avatarUrl?: string;
	callerId?: string;
	status?: UserStatus;
};

export type ExternalPeerInfo = {
	type: 'sip';
	number: string;
	displayName?: string;
	avatarUrl?: string;
};

export type UnknownPeerInfo = {
	type: 'unknown';
	displayName?: string;
};

export type ConnectionState = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING';

export type PeerInfo = InternalPeerInfo | ExternalPeerInfo | UnknownPeerInfo;

export type State = 'none' | 'calling' | 'ringing' | 'ongoing';

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
	escalated?: boolean;
	ringing?: boolean;
	supportedFeatures: readonly CallFeature[];
	confirmed: boolean;
	/** There is another call in progress, so this one can be swapped with it */
	hasAlternateCall: boolean;
	/** An attended transfer is waiting to be completed */
	canCompleteTransfer: boolean;
}

interface IEmptySession extends IBaseSession {
	state: Extract<State, 'none'>;
	callId: undefined;
}

interface ICallSession extends IBaseSession {
	state: Extract<State, 'calling' | 'ringing' | 'ongoing'>;
	callId: string;
	peerInfo: PeerInfo;
}

export type SessionState = IEmptySession | ICallSession;
