import { RoomAudioRenderer } from '@livekit/components-react';
import type { CallState } from '@rocket.chat/ui-conference';
import { render } from '@testing-library/react';
import type { Room } from 'livekit-client';
import { ConnectionState, Track } from 'livekit-client';
import type { ReactNode } from 'react';

import { LiveKitCallProvider } from './LiveKitCallProvider';
import type { RemoteSFUConnection } from './callConnections';
import { OWN_SFU } from './callConnections';
import type { CallMember } from './callRoster';
import { createCallRoster, remoteSFUsOf } from './callRoster';
import type { CallDataChannelPeers } from './useCallDataChannel';

const room = { state: ConnectionState.Connected, on: jest.fn(), off: jest.fn() };
const localParticipant = {
	identity: 'h-me',
	getTrackPublication: () => undefined,
};
const participant = (identity: string, name = identity) => ({ identity, name, kind: 0, getTrackPublication: () => undefined });

let ownParticipants: unknown[] = [];
let callState: CallState | undefined;
let dataChannelPeers: CallDataChannelPeers | undefined;

jest.mock('livekit-client', () => ({
	...jest.requireActual('livekit-client'),
	Room: jest.fn(() => room),
}));

jest.mock('@livekit/components-react', () => ({
	useLiveKitRoom: jest.fn(),
	useConnectionState: () => 'connected',
	useLocalParticipant: () => ({ localParticipant, isMicrophoneEnabled: true, isCameraEnabled: false, isScreenShareEnabled: false }),
	useParticipants: () => ownParticipants,
	useTracks: () => [],
	RoomAudioRenderer: jest.fn(() => null),
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	useToastMessageDispatch: () => jest.fn(),
	useUser: () => ({ _id: 'me', username: 'me', name: 'Me' }),
	useUserAvatarPath: () => () => '',
}));

jest.mock('@rocket.chat/ui-client', () => ({
	useUserDisplayName: () => 'Me',
}));

jest.mock('@rocket.chat/ui-conference', () => ({
	CallStateProvider: ({ value, children }: { value: CallState; children: ReactNode }) => {
		callState = value;
		return children;
	},
	CallActionsProvider: ({ children }: { children: ReactNode }) => children,
	VideoQualityProvider: ({ children }: { children: ReactNode }) => children,
	CallDiagnosticsProvider: ({ children }: { children: ReactNode }) => children,
	playJoinChime: jest.fn(),
	playMutedReminder: jest.fn(),
	useUpdateCallPreferences: () => jest.fn(),
}));

jest.mock('@rocket.chat/ui-media', () => ({
	DeviceSelectionProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('./useCallDataChannel', () => ({
	useCallDataChannel: (_localParticipant: unknown, peers: CallDataChannelPeers) => {
		dataChannelPeers = peers;
		return { raisedHands: [], localHandRaised: false, activeReactions: [] };
	},
}));
jest.mock('./useCallDiagnostics', () => ({ useCallDiagnostics: () => null }));
jest.mock('./useSendResolution', () => ({ useSendResolution: () => undefined }));
jest.mock('./useSpeakingWhileMuted', () => ({ useSpeakingWhileMuted: () => false }));
jest.mock('./useVideoQuality', () => ({ useVideoQuality: () => ({}) }));

jest.mock('./useLiveKitTransport', () => ({
	useLiveKitTransport: () => ({
		data: {
			serverUrl: 'wss://lk.rc1',
			token: 'token',
			federation: { serverName: 'rc1', transport: 'wss://lk.rc1', livekitIdentity: 'h-me' },
		},
		error: null,
	}),
}));

jest.mock('./useCallDeviceSwitching', () => ({
	useCallDeviceSwitching: () => ({ devices: [], selectedIds: {}, select: jest.fn() }),
}));

const members: CallMember[] = [
	{
		_id: 'me',
		username: 'me',
		name: 'Me',
		federation: { serverName: 'rc1', transport: 'wss://lk.rc1', livekitIdentity: 'h-me', local: true },
	},
	{
		_id: 'alice',
		username: 'alice',
		name: 'Alice',
		federation: { serverName: 'rc1', transport: 'wss://lk.rc1', livekitIdentity: 'h-alice', local: true },
	},
	{
		_id: 'carol',
		username: '@carol:rc2',
		name: 'Carol',
		federation: {
			serverName: 'rc2',
			transport: 'wss://lk.rc2',
			livekitIdentity: 'h-carol',
			livekitIdentityAliases: ['@carol:rc2:DEV'],
			local: false,
		},
	},
];

const roster = createCallRoster(members, ({ _id, username }) => ({ id: _id, displayName: username, avatarUrl: `/avatar/${username}` }));

const camera = { id: 'carol-camera' } as MediaStream;

const rc2Participants = new Map([
	[
		'@carol:rc2:DEV',
		{
			identity: '@carol:rc2:DEV',
			name: 'whatever rc2 calls her',
			getTrackPublication: (source: Track.Source) =>
				source === Track.Source.Camera ? { isSubscribed: true, isMuted: false, track: { mediaStream: camera } } : undefined,
		},
	],
	['watcher-from-rc1', { identity: 'watcher-from-rc1', name: 'watcher', getTrackPublication: () => undefined }],
]);

const rc2Room = { remoteParticipants: rc2Participants, on: jest.fn(), off: jest.fn(), switchActiveDevice: jest.fn() };
const remoteSFUs: RemoteSFUConnection[] = remoteSFUsOf(members).map((sfu) => ({ sfu, room: rc2Room as unknown as Room }));

const renderFederated = () =>
	render(
		<LiveKitCallProvider callId='call1' connect onEnded={jest.fn()} roster={roster} remoteSFUs={remoteSFUs}>
			<div />
		</LiveKitCallProvider>,
	);

beforeEach(() => {
	jest.clearAllMocks();
	callState = undefined;
	dataChannelPeers = undefined;
	ownParticipants = [localParticipant, participant('h-alice', 'alice on rc1'), participant('watcher-from-rc2'), participant('agent-1')];
});

it('shows the members of every SFU, each as the roster names them', () => {
	renderFederated();

	expect(callState?.remoteParticipants.map(({ id, displayName, avatarUrl }) => ({ id, displayName, avatarUrl }))).toEqual([
		{ id: 'alice', displayName: 'alice', avatarUrl: '/avatar/alice' },
		{ id: 'carol', displayName: '@carol:rc2', avatarUrl: '/avatar/@carol:rc2' },
	]);
});

// Tokens for other servers' members are not hidden, so every SFU carries people who are only watching it.
it('leaves out whoever on an SFU is not a member publishing there', () => {
	renderFederated();

	const ids = callState?.remoteParticipants.map(({ id }) => id);
	expect(ids).not.toContain('watcher-from-rc2');
	expect(ids).not.toContain('watcher-from-rc1');
	expect(ids).not.toContain('agent-1');
});

it('shows what another homeserver’s member sends over their SFU', () => {
	renderFederated();

	expect(callState?.remoteParticipants.find(({ id }) => id === 'carol')?.cameraStream).toBe(camera);
});

it('plays the audio of every SFU', () => {
	renderFederated();

	const rooms = jest.mocked(RoomAudioRenderer).mock.calls.map(([props]) => props.room);
	expect(rooms).toContain(room);
	expect(rooms).toContain(rc2Room);
});

it('hands the data channel every connection, and who is who on each', () => {
	renderFederated();

	expect(dataChannelPeers?.connections.map(({ room }) => room)).toEqual([room, rc2Room]);
	expect(dataChannelPeers?.selfId).toBe('me');
	expect(dataChannelPeers?.personOf(OWN_SFU, { identity: 'h-alice', name: '' })?.id).toBe('alice');
	expect(dataChannelPeers?.personOf(OWN_SFU, { identity: 'watcher-from-rc2', name: '' })).toBeUndefined();
});

// A mute request has to name the identity the member's own client goes by, which is the one seen on their SFU.
it('addresses a member by the identity they are seen under', () => {
	renderFederated();

	expect(dataChannelPeers?.targetOf('carol')).toBe('@carol:rc2:DEV');
	expect(dataChannelPeers?.targetOf('alice')).toBe('h-alice');
});
