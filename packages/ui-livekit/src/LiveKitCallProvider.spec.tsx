import { useLiveKitRoom } from '@livekit/components-react';
import type { CallActions } from '@rocket.chat/ui-conference';
import { act, render } from '@testing-library/react';
import { ConnectionState } from 'livekit-client';
import type { ReactNode } from 'react';

import { LiveKitCallProvider } from './LiveKitCallProvider';

const room = { state: ConnectionState.Disconnected, on: jest.fn(), off: jest.fn() };
const localParticipant = {
	identity: 'me',
	getTrackPublication: () => undefined,
	setMicrophoneEnabled: jest.fn(),
	setCameraEnabled: jest.fn(),
	setScreenShareEnabled: jest.fn(),
};
const dispatchToastMessage = jest.fn();
let actions: CallActions | undefined;

jest.mock('livekit-client', () => ({
	...jest.requireActual('livekit-client'),
	Room: jest.fn(() => room),
}));

jest.mock('@livekit/components-react', () => ({
	useLiveKitRoom: jest.fn(),
	useConnectionState: () => 'connected',
	useLocalParticipant: () => ({ localParticipant, isMicrophoneEnabled: true, isCameraEnabled: false, isScreenShareEnabled: false }),
	useParticipants: () => [],
	useTracks: () => [],
	RoomAudioRenderer: () => null,
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	useToastMessageDispatch: () => dispatchToastMessage,
	useUser: () => null,
	useUserAvatarPath: () => () => '',
}));

jest.mock('@rocket.chat/ui-client', () => ({
	useUserDisplayName: () => '',
}));

jest.mock('@rocket.chat/ui-conference', () => ({
	CallStateProvider: ({ children }: { children: ReactNode }) => children,
	CallActionsProvider: ({ value, children }: { value: CallActions; children: ReactNode }) => {
		actions = value;
		return children;
	},
	DeviceSelectionProvider: ({ children }: { children: ReactNode }) => children,
	VideoQualityProvider: ({ children }: { children: ReactNode }) => children,
	CallDiagnosticsProvider: ({ children }: { children: ReactNode }) => children,
	playJoinChime: jest.fn(),
	playMutedReminder: jest.fn(),
	useUpdateCallPreferences: () => jest.fn(),
}));

jest.mock('./useCallDataChannel', () => ({
	useCallDataChannel: () => ({ raisedHands: [], localHandRaised: false, activeReactions: [] }),
}));
jest.mock('./useCallDiagnostics', () => ({ useCallDiagnostics: () => null }));
jest.mock('./useSendResolution', () => ({ useSendResolution: () => undefined }));
jest.mock('./useSpeakingWhileMuted', () => ({ useSpeakingWhileMuted: () => false }));
jest.mock('./useVideoQuality', () => ({ useVideoQuality: () => ({}) }));

jest.mock('./useLiveKitTransport', () => ({
	useLiveKitTransport: () => ({ data: { serverUrl: 'wss://lk', token: 'token' }, error: null }),
}));

jest.mock('./useCallDeviceSwitching', () => ({
	useCallDeviceSwitching: () => ({ devices: [], selectedIds: {}, select: jest.fn() }),
}));

const mockedUseLiveKitRoom = jest.mocked(useLiveKitRoom);

const renderProvider = () => {
	const onEnded = jest.fn();
	render(
		<LiveKitCallProvider callId='call1' connect onEnded={onEnded}>
			<div />
		</LiveKitCallProvider>,
	);
	const { onError } = mockedUseLiveKitRoom.mock.calls[mockedUseLiveKitRoom.mock.calls.length - 1][0];
	return { onEnded, onError: onError as (error: Error) => void };
};

beforeEach(() => {
	jest.clearAllMocks();
	room.state = ConnectionState.Disconnected;
});

it('ends the call it could not join, saying why', () => {
	const { onEnded, onError } = renderProvider();

	act(() => onError(new Error('could not establish signal connection')));

	expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: expect.any(Error) });
	expect(onEnded).toHaveBeenCalled();
});

// A microphone refusing to publish is worth saying, not worth hanging up over.
it('keeps a call it is in when something inside it fails', () => {
	room.state = ConnectionState.Connected;
	const { onEnded, onError } = renderProvider();

	act(() => onError(new Error('could not publish microphone')));

	expect(dispatchToastMessage).toHaveBeenCalled();
	expect(onEnded).not.toHaveBeenCalled();
});

it('says nothing when the reader cancels the screen picker, but reports a real failure', async () => {
	renderProvider();

	localParticipant.setScreenShareEnabled.mockRejectedValueOnce(Object.assign(new Error('cancelled'), { name: 'NotAllowedError' }));
	await act(async () => actions?.toggleScreenShare());
	expect(dispatchToastMessage).not.toHaveBeenCalled();

	localParticipant.setScreenShareEnabled.mockRejectedValueOnce(new Error('not supported'));
	await act(async () => actions?.toggleScreenShare());
	expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: expect.any(Error) });
});
