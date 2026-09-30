import { createRequiredContext } from '../lib/createRequiredContext';

/** The reader, as the call running in this window has them. Each stream is present only while it is live. */
export type CallSelf = {
	id: string;
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	cameraOn: boolean;
	screenSharing: boolean;
	handRaised: boolean;
	/** Whether they are talking into a muted microphone. */
	speakingWhileMuted: boolean;
	/** What the encoder is actually sending, which is not what the camera captures. Undefined until it has sent a frame. */
	sendResolution?: { width: number; height: number };
	cameraStream?: MediaStream;
	screenStream?: MediaStream;
	microphoneStream?: MediaStream;
};

/** One other participant in the call. */
export type RemoteParticipantInfo = {
	id: string;
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	held: boolean;
	cameraStream?: MediaStream;
	screenStream?: MediaStream;
	/** Drives the per-tile speaking indicator. */
	audioStream?: MediaStream;
};

/** A reaction on screen; the provider drops it after `expiresAt`. */
export type ActiveReaction = { id: string; participantId: string; emoji: string; sentAt: number; expiresAt: number };

export type CallConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export type CallState = {
	self: CallSelf;
	remoteParticipants: RemoteParticipantInfo[];
	/** Every raised hand, oldest first: the index is the queue position. */
	raisedHands: { id: string; raisedAt: number }[];
	activeReactions: ActiveReaction[];
	startedAt: Date;
	connectionState: CallConnectionState;
};

export type CallActions = {
	toggleMic: () => void;
	toggleCamera: () => void;
	toggleScreenShare: () => void;
	toggleHand: () => void;
	sendReaction: (emoji: string) => void;
	/** Asks another participant to mute: their own client honours it, since nobody else can reach their microphone. */
	muteParticipant: (participantId: string) => void;
	leave: () => void;
};

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
	participants: ParticipantTrackStats[];
	audioConcealment?: number;
	timestamp: number;
};

export const [CallStateProvider, useCallState] = createRequiredContext<CallState>('CallState');

export const [CallActionsProvider, useCallActions] = createRequiredContext<CallActions>('CallActions');

/** `null` until the first sample has been taken. */
export const [CallDiagnosticsProvider, useCallDiagnostics] = createRequiredContext<CallDiagnosticsData | null>('CallDiagnostics');
