import type { Device } from '@rocket.chat/ui-contexts';
import { createContext, useContext } from 'react';

import type { SessionState, PeerInfo } from './definitions';

type MediaCallViewContextValue = {
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
	onSelectPeer: (peerInfo: PeerInfo) => void;
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

export const defaultMediaCallContextValue: MediaCallViewContextValue = {
	sessionState: defaultSessionState,
	onMute: () => undefined,
	onHold: () => undefined,
	onDeviceChange: () => undefined,
	onForward: () => undefined,
	onTone: () => undefined,
	onEndCall: () => undefined,
	onCall: () => Promise.resolve(undefined),
	onAccept: () => Promise.resolve(undefined),
	onSelectPeer: () => undefined,
};

const MediaCallViewContext = createContext<MediaCallViewContextValue>(defaultMediaCallContextValue);

export const useMediaCallView = (): MediaCallViewContextValue => useContext(MediaCallViewContext);

export default MediaCallViewContext;
