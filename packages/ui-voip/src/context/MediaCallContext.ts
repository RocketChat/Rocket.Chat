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

interface IBaseSession {
	state: State;
	connectionState: ConnectionState;
	peerInfo: PeerInfo | undefined;
	transferredBy: string | undefined;
	muted: boolean;
	held: boolean;
	remoteMuted: boolean;
	remoteHeld: boolean;
	startedAt?: Date | null; // todo not sure if I need this
	hidden: boolean;
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

type MediaCallContextType = {
	sessionState: SessionState;
	onClickDirectMessage?: () => void;
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
	setOpenRoomId: (roomId: string | undefined) => void;
	getAutocompleteOptions: (filter: string) => Promise<PeerAutocompleteOptions[]>;
};

const defaultSessionState: SessionState = {
	state: 'closed',
	connectionState: 'CONNECTED',
	peerInfo: undefined,
	transferredBy: undefined,
	hidden: false,
	muted: false,
	held: false,
	remoteMuted: false,
	remoteHeld: false,
	callId: undefined,
};

export const defaultMediaCallContextValue: MediaCallContextType = {
	sessionState: defaultSessionState,
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
	setOpenRoomId: () => undefined,
	getAutocompleteOptions: () => Promise.resolve([]),
};

export type MediaCallExternalState = State | 'unauthorized' | 'unlicensed';

type MediaCallUnauthorizedContextType = {
	sessionState: { state: 'unauthorized'; peerInfo: undefined };
	onToggleWidget: undefined;
	onEndCall: undefined;
	setOpenRoomId: undefined;
};

type MediaCallUnlicensedContextType = {
	sessionState: { state: 'unlicensed'; peerInfo: undefined };
	onToggleWidget: MediaCallContextType['onToggleWidget'];
	onEndCall: undefined;
	setOpenRoomId: undefined;
};

type MediaCallContextValue = MediaCallContextType | MediaCallUnauthorizedContextType | MediaCallUnlicensedContextType;

const isUnauthorized = (context: MediaCallContextValue): context is MediaCallUnauthorizedContextType => {
	return context.sessionState.state === 'unauthorized';
};

const isUnlicensed = (context: MediaCallContextValue): context is MediaCallUnlicensedContextType => {
	return context.sessionState.state === 'unlicensed';
};

const MediaCallContext = createContext<MediaCallContextType | MediaCallUnauthorizedContextType | MediaCallUnlicensedContextType>(
	defaultMediaCallContextValue,
);

export const isCallingBlocked = (state: MediaCallExternalState) => {
	return state !== 'new' && state !== 'closed';
};

// This hook is for internal use only. It will only be available if the user has the necessary permissions and the workspace has the necessary modules.
export const useMediaCallContext = (): MediaCallContextType => {
	const context = useContext(MediaCallContext);
	if (isUnauthorized(context)) {
		throw new Error('MediaCallContext is unauthorized');
	}
	if (isUnlicensed(context)) {
		throw new Error('MediaCallContext is unlicensed');
	}
	return context;
};

type UseMediaCallExternalContextResult = Pick<MediaCallContextType, 'sessionState' | 'onToggleWidget' | 'onEndCall' | 'setOpenRoomId'>;

export const useMediaCallExternalContext = ():
	| UseMediaCallExternalContextResult
	| MediaCallUnauthorizedContextType
	| MediaCallUnlicensedContextType => {
	const context = useContext(MediaCallContext);

	if (isUnauthorized(context)) {
		return {
			sessionState: context.sessionState,
			onToggleWidget: undefined,
			onEndCall: undefined,
			setOpenRoomId: undefined,
		};
	}

	if (isUnlicensed(context)) {
		return {
			sessionState: context.sessionState,
			onToggleWidget: context.onToggleWidget,
			onEndCall: undefined,
			setOpenRoomId: undefined,
		};
	}

	return {
		sessionState: context.sessionState,
		onToggleWidget: context.onToggleWidget,
		onEndCall: context.onEndCall,
		setOpenRoomId: context.setOpenRoomId,
	};
};

export default MediaCallContext;
