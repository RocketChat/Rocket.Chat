import type { Device } from '@rocket.chat/ui-contexts';

import { createRequiredContext } from '../lib/createRequiredContext';

/** The reader, as the call running in this window has them. Each stream is present only while it is live. */
export type CallSelf = {
	id: string;
	displayName: string;
	avatarUrl?: string;
	muted: boolean;
	cameraOn: boolean;
	screenSharing: boolean;
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
};

export const [CallStateProvider, useCallState] = createRequiredContext<CallState>('CallState');

export const [CallActionsProvider, useCallActions] = createRequiredContext<CallActions>('CallActions');

export const [CallDeviceSelectionProvider, useCallDeviceSelection] = createRequiredContext<CallDeviceSelection>('CallDeviceSelection');
