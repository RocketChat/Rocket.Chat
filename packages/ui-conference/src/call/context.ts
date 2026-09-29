import type { Device } from '@rocket.chat/ui-contexts';

import type { VideoQuality } from '../hooks/useCallDevicesInitialState';
import { createRequiredContext } from '../lib/createRequiredContext';

/** The reader, as the call running in this window has them. Each stream is present only while it is live. */
export type CallSelf = {
	id: string;
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	cameraOn: boolean;
	screenSharing: boolean;
	/** What the encoder is actually sending, which is not what the camera captures. Undefined until it has sent a frame. */
	sendResolution?: { width: number; height: number };
	cameraStream?: MediaStream;
	screenStream?: MediaStream;
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
};

export type CallConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export type CallState = {
	self: CallSelf;
	remoteParticipants: RemoteParticipantInfo[];
	startedAt: Date;
	connectionState: CallConnectionState;
};

export type CallActions = {
	toggleMic: () => void;
	toggleCamera: () => void;
	toggleScreenShare: () => void;
	leave: () => void;
};

export type CallDeviceSelection = {
	/** Every camera, microphone and speaker the browser lists, kept current as devices come and go. */
	devices: MediaDeviceInfo[];
	/** A microphone or a speaker, told apart by the device's own `type`. */
	selectAudioDevice: (device: Device) => void;
	selectCamera: (deviceId: string) => void;
	currentCameraId?: string;
	videoQuality: CallVideoQuality;
};

export type CallVideoQuality = {
	quality: VideoQuality;
	qualities: VideoQuality[];
	/** What the camera actually gave, which is not always what was asked for. */
	height?: number;
	pending: boolean;
	select: (quality: VideoQuality) => void;
};

export const [CallStateProvider, useCallState] = createRequiredContext<CallState>('CallState');

export const [CallActionsProvider, useCallActions] = createRequiredContext<CallActions>('CallActions');

export const [CallDeviceSelectionProvider, useCallDeviceSelection] = createRequiredContext<CallDeviceSelection>('CallDeviceSelection');
