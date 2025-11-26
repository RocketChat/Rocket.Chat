import type { UserStatus } from '@rocket.chat/core-typings';
import type { Device } from '@rocket.chat/ui-contexts';
import { createContext, useContext } from 'react';

import type { PeerAutocompleteOptions } from '../components';

type InternalPeerInfo = {
	displayName: string;
	userId: string;
	username?: string;
	avatarUrl?: string;
	callerId?: string;
	status?: UserStatus;
};

type ExternalPeerInfo = {
	number: string;
};

export type ConnectionState = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING';

export type PeerInfo = InternalPeerInfo | ExternalPeerInfo;

export type State = 'closed' | 'new' | 'calling' | 'ringing' | 'ongoing';

type MediaCallContextType = {
	state: State;
	connectionState: ConnectionState;

	peerInfo: PeerInfo | undefined;
	transferredBy: string | undefined;

	hidden: boolean;

	muted: boolean;
	held: boolean;

	remoteMuted: boolean;
	remoteHeld: boolean;

	onMute: () => void;
	onHold: () => void;

	onDeviceChange: (device: Device) => void;
	onForward: () => void;
	onTone: (tone: string) => void;

	onEndCall: () => void;

	onCall: () => Promise<void>;
	onAccept: () => Promise<void>;

	onToggleWidget: (peerInfo?: PeerInfo) => void;

	onSelectPeer: (peerInfo: PeerInfo) => void;

	getAutocompleteOptions: (filter: string) => Promise<PeerAutocompleteOptions[]>;
	// This is used to get the peer info from the server in case it's not available in the autocomplete options.
	getPeerInfo: (id: string) => Promise<PeerInfo | undefined>;
};

export const defaultMediaCallContextValue: MediaCallContextType = {
	state: 'closed',
	connectionState: 'CONNECTED',

	peerInfo: undefined,
	transferredBy: undefined,

	hidden: false,

	muted: false,
	held: false,
	remoteMuted: false,
	remoteHeld: false,

	onMute: () => undefined,
	onHold: () => undefined,

	onDeviceChange: () => undefined,
	onForward: () => undefined,
	onTone: () => undefined,

	onEndCall: () => undefined,
	onCall: () => Promise.resolve(undefined),
	onAccept: () => Promise.resolve(undefined),

	onToggleWidget: () => undefined,

	onSelectPeer: () => undefined,

	getAutocompleteOptions: () => Promise.resolve([]),
	getPeerInfo: () => Promise.resolve(undefined),
};

type MediaCallExternalContextType = {
	state: State;
	onToggleWidget: (peerInfo?: PeerInfo) => void;
	onEndCall: () => void;
	peerInfo: PeerInfo | undefined;
};

type MediaCallUnauthorizedContextType = {
	state: 'unauthorized';
	onToggleWidget: undefined;
	onEndCall: undefined;
	peerInfo: undefined;
};

type MediaCallUnlicensedContextType = {
	state: 'unlicensed';
	onToggleWidget: (peerInfo?: any) => void;
	onEndCall: undefined;
	peerInfo: undefined;
};

const MediaCallContext = createContext<MediaCallContextType | MediaCallUnauthorizedContextType | MediaCallUnlicensedContextType>(
	defaultMediaCallContextValue,
);

export type MediaCallExternalState = State | 'unauthorized' | 'unlicensed';

export const isCallingBlocked = (state: MediaCallExternalState) => {
	return state !== 'new' && state !== 'closed';
};

// This hook is for internal use only. It will only be available if the user has the necessary permissions and the workspace has the necessary modules.
export const useMediaCallContext = (): MediaCallContextType => {
	const context = useContext(MediaCallContext);
	if (context.state === 'unauthorized') {
		throw new Error('MediaCallContext is unauthorized');
	}
	if (context.state === 'unlicensed') {
		throw new Error('MediaCallContext is unlicensed');
	}
	return context;
};

// This hook is for other modules/packages, and exposes the necessary properties to interact with the context.
export const useMediaCallExternalContext = ():
	| MediaCallExternalContextType
	| MediaCallUnauthorizedContextType
	| MediaCallUnlicensedContextType => {
	const context = useContext(MediaCallContext);

	if (context.state === 'unauthorized' || context.state === 'unlicensed') {
		return context;
	}

	return { state: context.state, onToggleWidget: context.onToggleWidget, onEndCall: context.onEndCall, peerInfo: context.peerInfo };
};

export default MediaCallContext;
