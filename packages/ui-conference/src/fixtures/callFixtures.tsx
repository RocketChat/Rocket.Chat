import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { action } from 'storybook/actions';

import { JOHN_DOE_ID } from './storyFixtures';
import type { CallActions, CallDiagnosticsData, CallMediaProcessing, CallSelf, CallState, RemoteParticipantInfo } from '../call/context';
import { CallActionsProvider, CallDiagnosticsProvider, CallMediaProcessingProvider, CallStateProvider } from '../call/context';
import type { DeviceSelection } from '../devices/DeviceSelectionContext';
import { DeviceSelectionProvider } from '../devices/DeviceSelectionContext';
import type { VideoQualitySelection } from '../devices/VideoQualityContext';
import { VideoQualityProvider } from '../devices/VideoQualityContext';

export const buildCallSelf = (overrides: Partial<CallSelf> = {}): CallSelf => ({
	id: JOHN_DOE_ID,
	displayName: 'John Doe',
	muted: false,
	cameraOn: false,
	screenSharing: false,
	handRaised: false,
	speakingWhileMuted: false,
	...overrides,
});

export const buildRemoteParticipant = (
	overrides: Partial<RemoteParticipantInfo> & Pick<RemoteParticipantInfo, 'id' | 'displayName'>,
): RemoteParticipantInfo => ({ muted: false, held: false, ...overrides });

/** The same five people every call story is about, so a layout story differs from the next only in its layout. */
export const remoteParticipants: RemoteParticipantInfo[] = [
	buildRemoteParticipant({ id: 'ada', displayName: 'Ada Lovelace' }),
	buildRemoteParticipant({ id: 'grace', displayName: 'Grace Hopper', muted: true }),
	buildRemoteParticipant({ id: 'alan', displayName: 'Alan Turing' }),
	buildRemoteParticipant({ id: 'katherine', displayName: 'Katherine Johnson', held: true }),
];

export const buildCallState = ({
	self,
	...overrides
}: Omit<Partial<CallState>, 'self'> & { self?: Partial<CallSelf> } = {}): CallState => ({
	self: buildCallSelf(self),
	remoteParticipants: [],
	raisedHands: [],
	activeReactions: [],
	startedAt: new Date(),
	connectionState: 'connected',
	...overrides,
});

export const buildCallActions = (): CallActions => ({
	toggleMic: action('toggleMic'),
	toggleCamera: action('toggleCamera'),
	toggleScreenShare: action('toggleScreenShare'),
	toggleHand: action('toggleHand'),
	sendReaction: action('sendReaction'),
	muteParticipant: action('muteParticipant'),
	leave: action('leave'),
});

/** What the browser would list, since a story has no hardware of its own. */
export const fakeDevices = [
	{ deviceId: 'default', kind: 'audioinput', label: 'Default - MacBook Pro Microphone', groupId: 'built-in' },
	{ deviceId: 'built-in-mic', kind: 'audioinput', label: 'MacBook Pro Microphone', groupId: 'built-in' },
	{ deviceId: 'yeti', kind: 'audioinput', label: 'Yeti Stereo Microphone (046d:0ab7)', groupId: 'usb' },
	{ deviceId: 'default', kind: 'audiooutput', label: 'Default - MacBook Pro Speakers', groupId: 'built-in' },
	{ deviceId: 'facetime', kind: 'videoinput', label: 'FaceTime HD Camera', groupId: 'built-in' },
	{ deviceId: 'brio', kind: 'videoinput', label: 'Logitech BRIO (046d:085e)', groupId: 'brio' },
] as unknown as MediaDeviceInfo[];

export const buildDeviceSelection = (overrides: Partial<DeviceSelection> = {}): DeviceSelection => ({
	devices: fakeDevices,
	selectedIds: { audioinput: 'default', audiooutput: 'default', videoinput: 'facetime' },
	select: action('select'),
	...overrides,
});

export const buildVideoQuality = (overrides: Partial<VideoQualitySelection> = {}): VideoQualitySelection => ({
	quality: 'auto',
	qualities: ['auto', 'h1080', 'h720', 'h360', 'h180'],
	height: 720,
	pending: false,
	select: action('selectVideoQuality'),
	...overrides,
});

/** Every processing choice offered, with the weakest of each in use. */
export const buildMediaProcessing = (): CallMediaProcessing => ({
	noiseSuppression: { methods: ['none', 'browser', 'rnnoise'], method: 'browser', pending: false, select: action('selectNoiseMethod') },
	backgroundBlur: {
		available: true,
		level: 'none',
		levels: ['none', 'light', 'medium', 'strong'],
		blur: 'processor',
		pending: false,
		model: 'quality',
		models: ['quality', 'performance'],
		select: action('selectBlurLevel'),
		selectModel: action('selectBlurModel'),
		backgroundImage: {
			available: true,
			active: false,
			hasImage: false,
			select: async (file) => action('selectBackgroundImage')(file),
			activate: action('activateBackgroundImage'),
		},
	},
});

export const diagnosticsSample: CallDiagnosticsData = {
	serverUrl: 'wss://livekit.example.com',
	connectionState: 'connected',
	connectionQuality: 'excellent',
	roundTripTimeMs: 42,
	uploadKbps: 1480,
	downloadKbps: 3210,
	totalBytesSent: 18_400_000,
	totalBytesReceived: 41_900_000,
	sendWidth: 1280,
	sendHeight: 720,
	sendFps: 30,
	sendCodec: 'VP8',
	participants: [
		{
			id: 'ada',
			displayName: 'Ada Lovelace',
			videoWidth: 1280,
			videoHeight: 720,
			videoCodec: 'VP8',
			fps: 30,
			videoBitrateKbps: 1210,
			audioBitrateKbps: 32,
			packetsLost: 3,
			jitterMs: 4,
		},
	],
	timestamp: 0,
};

export type CallFixture = {
	state?: Parameters<typeof buildCallState>[0];
	deviceSelection?: Partial<DeviceSelection>;
	videoQuality?: Partial<VideoQualitySelection>;
	diagnostics?: CallDiagnosticsData | null;
};

const CallContexts = ({ state, deviceSelection, videoQuality, diagnostics = null, children }: CallFixture & { children: ReactNode }) => {
	// Built on mount, so the call starts when the story does and the timer in a snapshot always reads zero.
	const [callState] = useState(() => buildCallState(state));
	const [actions] = useState(buildCallActions);
	const [devices] = useState(() => buildDeviceSelection(deviceSelection));
	const [quality] = useState(() => buildVideoQuality(videoQuality));
	const [mediaProcessing] = useState(buildMediaProcessing);

	return (
		<CallStateProvider value={callState}>
			<CallActionsProvider value={actions}>
				<DeviceSelectionProvider value={devices}>
					<VideoQualityProvider value={quality}>
						<CallMediaProcessingProvider value={mediaProcessing}>
							<CallDiagnosticsProvider value={diagnostics}>{children}</CallDiagnosticsProvider>
						</CallMediaProcessingProvider>
					</VideoQualityProvider>
				</DeviceSelectionProvider>
			</CallActionsProvider>
		</CallStateProvider>
	);
};

/** The contexts a provider running the call in this window fills, told rather than connected: every action logs. */
export const withCall =
	(fixture: CallFixture = {}): Decorator =>
	// eslint-disable-next-line react/display-name, react/no-multi-comp
	(Story) => (
		<CallContexts
			state={fixture.state}
			deviceSelection={fixture.deviceSelection}
			videoQuality={fixture.videoQuality}
			diagnostics={fixture.diagnostics}
		>
			<Story />
		</CallContexts>
	);
