import type { DeviceSelection } from '@rocket.chat/ui-media';
import { DeviceSelectionProvider } from '@rocket.chat/ui-media';
import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { action } from 'storybook/actions';

import { JOHN_DOE_ID } from './storyFixtures';
import type { CallActions, CallSelf, CallState, RemoteParticipantInfo } from '../call/context';
import { CallActionsProvider, CallStateProvider } from '../call/context';

export const buildCallSelf = (overrides: Partial<CallSelf> = {}): CallSelf => ({
	id: JOHN_DOE_ID,
	displayName: 'John Doe',
	muted: false,
	cameraOn: false,
	screenSharing: false,
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
	startedAt: new Date(),
	connectionState: 'connected',
	...overrides,
});

export const buildCallActions = (): CallActions => ({
	toggleMic: action('toggleMic'),
	toggleCamera: action('toggleCamera'),
	toggleScreenShare: action('toggleScreenShare'),
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

export type CallFixture = {
	state?: Parameters<typeof buildCallState>[0];
	deviceSelection?: Partial<DeviceSelection>;
};

const CallContexts = ({ state, deviceSelection, children }: CallFixture & { children: ReactNode }) => {
	// Built on mount, so the call starts when the story does and the timer in a snapshot always reads zero.
	const [callState] = useState(() => buildCallState(state));
	const [actions] = useState(buildCallActions);
	const [devices] = useState(() => buildDeviceSelection(deviceSelection));

	return (
		<CallStateProvider value={callState}>
			<CallActionsProvider value={actions}>
				<DeviceSelectionProvider value={devices}>{children}</DeviceSelectionProvider>
			</CallActionsProvider>
		</CallStateProvider>
	);
};

/** The contexts a provider running the call in this window fills, told rather than connected: every action logs. */
export const withCall =
	(fixture: CallFixture = {}): Decorator =>
	// eslint-disable-next-line react/display-name, react/no-multi-comp
	(Story) => (
		<CallContexts state={fixture.state} deviceSelection={fixture.deviceSelection}>
			<Story />
		</CallContexts>
	);
