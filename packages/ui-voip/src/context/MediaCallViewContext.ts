import { type IMediaStreamWrapper, type CallFeature } from '@rocket.chat/media-signaling';
import type { Device } from '@rocket.chat/ui-contexts';
import { createContext, useContext } from 'react';

import type { SessionState, PeerInfo } from './definitions';
import { type LastKnownPosition } from '../providers/useWidgetPositionTracker';

export type MediaCallStreams = {
	remoteScreen?: IMediaStreamWrapper;
	localScreen?: IMediaStreamWrapper;
};

type MediaCallViewContextValue = {
	sessionState: SessionState;
	allowedFeatures: readonly CallFeature[];
	targetPeer?: PeerInfo;
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
	onToggleScreenSharing: () => void;
	onOpenPopout: () => void;
	onClosePopout: () => void;
	streams: MediaCallStreams;
	widgetPositionTracker?: {
		onChangePosition: (position: LastKnownPosition | null) => void;
		lastKnownPosition: LastKnownPosition | null;
	};
};

export const defaultSessionState: SessionState = {
	state: 'none',
	connectionState: 'CONNECTING',
	peerInfo: undefined,
	transferredBy: undefined,
	hidden: false,
	muted: false,
	held: false,
	remoteMuted: false,
	remoteHeld: false,
	callId: undefined,
	startedAt: undefined,
	supportedFeatures: ['audio', 'transfer', 'hold'],
};

export const defaultMediaCallContextValue: MediaCallViewContextValue = {
	sessionState: defaultSessionState,
	allowedFeatures: [],
	targetPeer: undefined,
	onMute: () => undefined,
	onHold: () => undefined,
	onDeviceChange: () => undefined,
	onForward: () => undefined,
	onTone: () => undefined,
	onEndCall: () => undefined,
	onCall: () => Promise.resolve(undefined),
	onAccept: () => Promise.resolve(undefined),
	onSelectPeer: () => undefined,
	onToggleScreenSharing: () => undefined,
	onOpenPopout: () => undefined,
	onClosePopout: () => undefined,
	streams: {},
};

const MediaCallViewContext = createContext<MediaCallViewContextValue>(defaultMediaCallContextValue);

export const useMediaCallView = (): MediaCallViewContextValue => useContext(MediaCallViewContext);

export default MediaCallViewContext;
