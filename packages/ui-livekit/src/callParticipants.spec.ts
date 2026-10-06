import { ConnectionState, ParticipantKind, Track } from 'livekit-client';

import type { ParticipantTrack } from './callParticipants';
import { connectionStateFor, isAgentParticipant, otherPeople, toRemoteParticipantInfo } from './callParticipants';

const camera = { id: 'camera' } as MediaStream;
const screen = { id: 'screen' } as MediaStream;

const person = (identity: string, kind = ParticipantKind.STANDARD) => ({ identity, kind });

const trackFor = (identity: string, mediaStream: MediaStream, isMuted = false): ParticipantTrack => ({
	participant: { identity },
	publication: { isMuted, track: { mediaStream } },
});

const remote = (identity: string, name: string, micMuted?: boolean) => ({
	identity,
	name,
	getTrackPublication: (source: Track.Source) =>
		source === Track.Source.Microphone && micMuted !== undefined ? { isMuted: micMuted } : undefined,
});

describe('isAgentParticipant', () => {
	it('knows an agent by its kind, or by the identity a worker gives one', () => {
		expect(isAgentParticipant(person('ada', ParticipantKind.AGENT))).toBe(true);
		expect(isAgentParticipant(person('agent-AJ_x1'))).toBe(true);
		expect(isAgentParticipant(person('agent_1'))).toBe(true);
		expect(isAgentParticipant(person('AJ_abc123'))).toBe(true);
		expect(isAgentParticipant(person('ada'))).toBe(false);
	});
});

describe('otherPeople', () => {
	it('leaves out the reader and any agent', () => {
		const everyone = [person('me'), person('ada'), person('agent-1'), person('bob')];
		expect(otherPeople(everyone, 'me').map(({ identity }) => identity)).toEqual(['ada', 'bob']);
	});
});

describe('connectionStateFor', () => {
	it('reduces LiveKit states to the four the call UI tells apart', () => {
		expect(connectionStateFor(ConnectionState.Connected)).toBe('connected');
		expect(connectionStateFor(ConnectionState.Connecting)).toBe('connecting');
		expect(connectionStateFor(ConnectionState.Reconnecting)).toBe('reconnecting');
		expect(connectionStateFor(ConnectionState.SignalReconnecting)).toBe('reconnecting');
		expect(connectionStateFor(ConnectionState.Disconnected)).toBe('disconnected');
	});
});

describe('toRemoteParticipantInfo', () => {
	it('picks out their own tracks and names them', () => {
		const info = toRemoteParticipantInfo(
			remote('ada', 'Ada', false),
			{
				camera: [trackFor('bob', screen), trackFor('ada', camera)],
				screen: [trackFor('ada', screen)],
			},
			'/avatar/ada',
		);

		expect(info).toEqual({
			id: 'ada',
			displayName: 'Ada',
			avatarUrl: '/avatar/ada',
			muted: false,
			held: false,
			cameraStream: camera,
			screenStream: screen,
		});
	});

	// A muted camera still has a stream, and it would draw black where the avatar belongs.
	it('drops the streams of muted publications and counts a missing microphone as muted', () => {
		const info = toRemoteParticipantInfo(
			remote('ada', ''),
			{ camera: [trackFor('ada', camera, true)], screen: [trackFor('ada', screen, true)] },
			'/avatar/ada',
		);

		expect(info).toMatchObject({
			displayName: 'ada',
			muted: true,
			cameraStream: undefined,
			screenStream: undefined,
		});
	});
});
