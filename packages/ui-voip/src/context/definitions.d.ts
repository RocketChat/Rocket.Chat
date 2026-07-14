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
	displayName?: string;
	avatarUrl?: string;
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
	ringing?: boolean;
	supportedFeatures: readonly CallFeature[];
	// True when the idle dialer ('new') is docked inside a slot (the sidebar call panel)
	// rather than opened as a free-floating composer. A docked dialer must never render as
	// a floating widget: when its slot goes away (navigating off the panel) it disappears
	// instead of popping out. Irrelevant for non-'new' states.
	docked?: boolean;
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
