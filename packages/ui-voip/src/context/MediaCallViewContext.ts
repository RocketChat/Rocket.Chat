import { type IMediaStreamWrapper } from '@rocket.chat/media-signaling';
import type { Device } from '@rocket.chat/ui-contexts';
import { createContext, useContext } from 'react';

import type { SessionState, PeerInfo } from './definitions';
import { type LastKnownPosition } from '../providers/useWidgetPositionTracker';

export type ParticipantTrackStats = {
	id: string;
	displayName: string;
	videoWidth?: number;
	videoHeight?: number;
	videoCodec?: string;
	fps?: number;
	videoBitrateKbps?: number;
	audioBitrateKbps?: number;
	packetsLost?: number;
	jitterMs?: number;
};

export type BackgroundBlurDiagnostics = {
	fps?: number;
	frameMs?: number;
	compositorMs?: number;
	segmentationMs?: number;
	segmentIntervalMs: number;
	qualityReduction: 0 | 1 | 2;
};

export type CallDiagnosticsData = {
	serverUrl: string;
	connectionState: string;
	connectionQuality: string;
	roundTripTimeMs?: number;
	uploadKbps?: number;
	downloadKbps?: number;
	totalBytesSent?: number;
	totalBytesReceived?: number;
	sendWidth?: number;
	sendHeight?: number;
	sendFps?: number;
	sendCodec?: string;
	qualityLimitationReason?: string;
	backgroundBlur?: BackgroundBlurDiagnostics;
	participants: ParticipantTrackStats[];
	audioConcealment?: number;
	timestamp: number;
};

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
	// Camera toggling is a Video Conference feature (LiveKit). The 1:1 VoIP
	// path doesn't supply this, so consumers must handle undefined.
	onToggleCamera?: () => void;
	/**
	 * Toggle the local user's "raise hand" state. Group calls broadcast this
	 * over the LK data channel; direct calls only track it locally.
	 */
	onToggleHand?: () => void;
	/** Whether the local user currently has their hand raised. */
	localHandRaised?: boolean;
	/**
	 * Ask another participant to mute themselves.
	 *
	 * A request rather than an act, and deliberately so: muting someone else's microphone from here would mean
	 * reaching into their machine, so what travels is a message their own client honours by muting itself and
	 * saying who asked. Only offered where the transport can carry it — group calls today.
	 */
	onMuteParticipant?: (participantId: string) => void;
	/**
	 * Noise cancelling on the local microphone, where the transport can do it. `available` is false until there is
	 * a filter to switch — it arrives with the published track — and on browsers that cannot run one at all.
	 */
	noiseSuppression?: {
		/** Which ways of cleaning up the microphone this workspace can actually offer, weakest first. */
		methods: string[];
		/** The one running. */
		method: string;
		pending?: boolean;
		select: (method: string) => void;
	};
	/**
	 * Blurring the background of the local camera, where something can do it. `blur` says what is doing it — the
	 * camera itself, or frame-by-frame segmentation of ours — and `pending` is true while ours is starting, which
	 * is the one slow moment in it.
	 */
	backgroundBlur?: {
		available: boolean;
		level: string;
		levels: string[];
		blur?: 'camera' | 'processor' | null;
		pending?: boolean;
		select: (level: string) => void;
		model?: string;
		models?: readonly string[];
		selectModel?: (model: string) => void;
		backgroundImage?: {
			available: boolean;
			active: boolean;
			hasImage: boolean;
			name?: string;
			select: (file: File) => Promise<void>;
			activate: () => void;
		};
	};
	/**
	 * The most detail to send. `height` is what the camera actually gave, which is not always what was asked for.
	 */
	videoQuality?: { quality: string; qualities: string[]; height?: number; pending?: boolean; select: (quality: string) => void };
	/**
	 * The resolution the encoder is actually sending, which is not the camera's: bandwidth, CPU and how large the far
	 * side displays you all decide which simulcast layer goes out. Undefined until the encoder has produced a frame.
	 */
	sendResolution?: { width: number; height: number };
	/**
	 * All raised hands across the call, ordered by raise time (oldest first).
	 * The index + 1 is the queue position rendered on the participant tile.
	 */
	raisedHands?: { id: string; raisedAt: number }[];
	/**
	 * Currently-active reactions across the call. The provider auto-removes
	 * each one after its `expiresAt`. Indexed by sender participant id so the
	 * UI can render the emoji on the sender's tile.
	 */
	activeReactions?: { id: string; participantId: string; emoji: string; sentAt: number; expiresAt: number }[];
	/** Send a reaction emoji from the local user. */
	onSendReaction?: (emoji: string) => void;
	/**
	 * Switch the active camera input (videoinput device). Only meaningful when
	 * the underlying transport supports live device switching — currently
	 * wired by the LiveKit provider. P2P providers may leave this undefined,
	 * in which case the camera-chevron menu won't render.
	 */
	onVideoInputChange?: (deviceId: string) => void;
	/** Currently-active camera deviceId, used to mark the selected entry in the picker. */
	currentCameraDeviceId?: string;
	/** Whether the user is speaking while their microphone is muted. */
	speakingWhileMuted?: boolean;
	onOpenPopout: () => void;
	onClosePopout: () => void;
	streams: MediaCallStreams;
	/**
	 * Remote participants in the call. Populated by the VC LiveKit bridge for
	 * group calls (length N). The 1:1 VoIP path doesn't supply this; consumers
	 * default to an empty array.
	 */
	remoteParticipants?: RemoteParticipantInfo[];
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
	onToggleCamera: () => undefined,
	onMuteParticipant: () => undefined,
	onOpenPopout: () => undefined,
	onClosePopout: () => undefined,
	streams: {},
	remoteParticipants: [],
};

const MediaCallViewContext = createContext<MediaCallViewContextValue>(defaultMediaCallContextValue);

export const useMediaCallView = (): MediaCallViewContextValue => useContext(MediaCallViewContext);

export default MediaCallViewContext;
