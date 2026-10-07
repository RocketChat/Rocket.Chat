import type { CallConnectionState, RemoteParticipantInfo } from '@rocket.chat/ui-conference';
import type { Participant } from 'livekit-client';
import { ConnectionState, ParticipantKind, Track } from 'livekit-client';

/** A published track as LiveKit's track hooks hand it over: whose it is, and the publication once there is one. */
export type ParticipantTrack = {
	participant: Pick<Participant, 'identity'>;
	publication?: { isMuted: boolean; track?: { mediaStream?: MediaStream } };
};

export type ParticipantTracks = {
	camera: ParticipantTrack[];
	screen: ParticipantTrack[];
};

/**
 * Agents are not people in the call. `kind` can be set after an agent first appears, so its identity — fixed at
 * join time, `agent-AJ_<jobId>` when the worker sets none — is checked too.
 */
export const isAgentParticipant = (participant: Pick<Participant, 'kind' | 'identity'>) => {
	if (participant.kind === ParticipantKind.AGENT) return true;
	const id = participant.identity || '';
	return id.startsWith('agent-') || id.startsWith('agent_') || /^AJ_[A-Za-z0-9]+$/.test(id);
};

/** The people in the call besides the reader. */
export const otherPeople = <P extends Pick<Participant, 'kind' | 'identity'>>(participants: P[], localIdentity: string): P[] =>
	participants.filter((p) => p.identity !== localIdentity && !isAgentParticipant(p));

export const connectionStateFor = (state: ConnectionState): CallConnectionState => {
	switch (state) {
		case ConnectionState.Connected:
			return 'connected';
		case ConnectionState.Connecting:
			return 'connecting';
		case ConnectionState.Reconnecting:
		case ConnectionState.SignalReconnecting:
			return 'reconnecting';
		default:
			return 'disconnected';
	}
};

const trackOf = (tracks: ParticipantTrack[], identity: string) => tracks.find((t) => t.participant.identity === identity);

/** A remote participant as the call UI draws them. */
export const toRemoteParticipantInfo = (
	participant: Pick<Participant, 'identity' | 'name'> & { getTrackPublication: (source: Track.Source) => { isMuted: boolean } | undefined },
	tracks: ParticipantTracks,
	avatarUrl: string,
): RemoteParticipantInfo => {
	const cam = trackOf(tracks.camera, participant.identity);
	const scr = trackOf(tracks.screen, participant.identity);
	const micPub = participant.getTrackPublication(Track.Source.Microphone);
	// A muted publication can still surface here, and its stream renders as a black frame instead of the avatar.
	const camMuted = cam?.publication?.isMuted ?? true;
	const scrMuted = scr?.publication?.isMuted ?? true;
	return {
		id: participant.identity,
		displayName: participant.name || participant.identity,
		avatarUrl,
		muted: Boolean(!micPub || micPub.isMuted),
		held: false,
		cameraStream: cam && !camMuted ? cam.publication?.track?.mediaStream : undefined,
		screenStream: scr && !scrMuted ? scr.publication?.track?.mediaStream : undefined,
	};
};
