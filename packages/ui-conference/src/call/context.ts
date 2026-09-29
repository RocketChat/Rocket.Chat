import type { Device } from '@rocket.chat/ui-contexts';

import type { BlurLevel, BlurModel, NoiseMethod, VideoQuality } from '../hooks/useCallDevicesInitialState';
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

export type CallDeviceSelection = {
	/** Every camera, microphone and speaker the browser lists, kept current as devices come and go. */
	devices: MediaDeviceInfo[];
	/** A microphone or a speaker, told apart by the device's own `type`. */
	selectAudioDevice: (device: Device) => void;
	selectCamera: (deviceId: string) => void;
	currentCameraId?: string;
};

export type CallNoiseSuppression = {
	/** What this workspace can offer, weakest first. Empty until there is a microphone track to filter. */
	methods: NoiseMethod[];
	method: NoiseMethod;
	pending: boolean;
	select: (method: NoiseMethod) => void;
};

export type CallBackgroundBlur = {
	available: boolean;
	level: BlurLevel;
	levels: BlurLevel[];
	/** What is doing the blurring: the camera itself, or segmentation of every frame here. */
	blur?: 'camera' | 'processor' | null;
	pending: boolean;
	model: BlurModel;
	models: readonly BlurModel[];
	select: (level: BlurLevel) => void;
	selectModel: (model: BlurModel) => void;
	backgroundImage: {
		available: boolean;
		active: boolean;
		hasImage: boolean;
		name?: string;
		select: (file: File) => Promise<void>;
		activate: () => void;
	};
};

export type CallVideoQuality = {
	quality: VideoQuality;
	qualities: VideoQuality[];
	/** What the camera actually gave, which is not always what was asked for. */
	height?: number;
	pending: boolean;
	select: (quality: VideoQuality) => void;
};

export type CallMediaProcessing = {
	noiseSuppression: CallNoiseSuppression;
	backgroundBlur: CallBackgroundBlur;
	videoQuality: CallVideoQuality;
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

export const [CallStateProvider, useCallState] = createRequiredContext<CallState>('CallState');

export const [CallActionsProvider, useCallActions] = createRequiredContext<CallActions>('CallActions');

export const [CallDeviceSelectionProvider, useCallDeviceSelection] = createRequiredContext<CallDeviceSelection>('CallDeviceSelection');

export const [CallMediaProcessingProvider, useCallMediaProcessing] = createRequiredContext<CallMediaProcessing>('CallMediaProcessing');

/** `null` until the first sample has been taken. */
export const [CallDiagnosticsProvider, useCallDiagnostics] = createRequiredContext<CallDiagnosticsData | null>('CallDiagnostics');
