import { type IMediaStreamWrapper } from '@rocket.chat/media-signaling';
import type { Device } from '@rocket.chat/ui-contexts';
import { createContext, useContext } from 'react';

import type { SessionState, PeerInfo } from './definitions';
import { type LastKnownPosition } from '../providers/useWidgetPositionTracker';

export type MediaCallStreams = {
	remoteScreen?: IMediaStreamWrapper;
	localScreen?: IMediaStreamWrapper;
	remoteCamera?: IMediaStreamWrapper;
	localCamera?: IMediaStreamWrapper;
	/** Local microphone stream — used to drive the local speaking indicator. */
	localMicrophone?: IMediaStreamWrapper;
	/**
	 * Remote microphone stream — used to drive the remote speaking indicator
	 * on 1:1 P2P calls. Group calls (LK) attach audioStream per-participant on
	 * RemoteParticipantInfo instead.
	 */
	remoteMicrophone?: IMediaStreamWrapper;
};

/**
 * One remote participant in a media call. The room section iterates this list
 * regardless of whether the call is 1:1 (length 1) or a group call (N peers).
 */
export type RemoteParticipantInfo = {
	id: string;
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	held: boolean;
	cameraStream?: MediaStream;
	screenStream?: MediaStream;
	/** Microphone MediaStream — drives the per-tile speaking indicator. */
	audioStream?: MediaStream;
};

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
	onToggleScreenSharing: () => void;
	onToggleCamera: () => void;
	/**
	 * Toggle the local user's "raise hand" state. Group calls broadcast this
	 * over the LK data channel; direct calls only track it locally.
	 */
	onToggleHand?: () => void;
	/** Whether the local user currently has their hand raised. */
	localHandRaised?: boolean;
	/**
	 * All raised hands across the call, ordered by raise time (oldest first).
	 * The index + 1 is the queue position rendered on the participant tile.
	 */
	raisedHands?: { id: string; raisedAt: number }[];
	streams: MediaCallStreams;
	/**
	 * Remote participants in the call. Always present (possibly empty when the
	 * call is pre-ongoing or you're alone in a group). MediaCallRoomSection
	 * iterates this to render PeerCards — 1:1 calls populate length 1, group
	 * calls populate N.
	 */
	remoteParticipants: RemoteParticipantInfo[];
	widgetPositionTracker?: {
		onChangePosition: (position: LastKnownPosition | null) => void;
		getRestorePosition: () => LastKnownPosition | null;
	};
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
	supportedFeatures: ['audio', 'transfer', 'hold'],
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
	onToggleScreenSharing: () => undefined,
	onToggleCamera: () => undefined,
	streams: {},
	remoteParticipants: [],
};

const MediaCallViewContext = createContext<MediaCallViewContextValue>(defaultMediaCallContextValue);

export const useMediaCallView = (): MediaCallViewContextValue => useContext(MediaCallViewContext);

export default MediaCallViewContext;
