import type { RemoteParticipant } from 'livekit-client';
import { RoomEvent } from 'livekit-client';
import { useMemo, useSyncExternalStore } from 'react';

import type { RemoteSFUConnection } from './callConnections';

/** After any of these, a connection's participants, or the tracks they have subscribed for us, read differently. */
const PARTICIPANT_EVENTS = [
	RoomEvent.ConnectionStateChanged,
	RoomEvent.ParticipantConnected,
	RoomEvent.ParticipantDisconnected,
	RoomEvent.TrackSubscribed,
	RoomEvent.TrackUnsubscribed,
	RoomEvent.TrackMuted,
	RoomEvent.TrackUnmuted,
] as const;

export type RemoteSFUParticipant = { connection: RemoteSFUConnection; participant: RemoteParticipant };

const participantsOf = (connections: readonly RemoteSFUConnection[]): RemoteSFUParticipant[] =>
	connections.flatMap((connection) => [...connection.room.remoteParticipants.values()].map((participant) => ({ connection, participant })));

const sameParticipants = (a: RemoteSFUParticipant[], b: RemoteSFUParticipant[]): boolean =>
	a.length === b.length && a.every((entry, index) => entry.participant === b[index].participant);

/** Everyone the remote SFU connections carry, read again whenever any of them arrives, leaves or changes what they publish. */
export const useRemoteSFUParticipants = (connections: readonly RemoteSFUConnection[]): RemoteSFUParticipant[] => {
	const store = useMemo(() => {
		let snapshot = participantsOf(connections);

		return {
			subscribe: (onChange: () => void) => {
				const refresh = () => {
					snapshot = participantsOf(connections);
					onChange();
				};
				// Someone who arrived between reading the snapshot and listening shows up on the check React makes after subscribing.
				const current = participantsOf(connections);
				if (!sameParticipants(snapshot, current)) {
					snapshot = current;
				}
				connections.forEach(({ room }) => PARTICIPANT_EVENTS.forEach((event) => room.on(event, refresh)));
				return () => {
					connections.forEach(({ room }) => PARTICIPANT_EVENTS.forEach((event) => room.off(event, refresh)));
				};
			},
			getSnapshot: () => snapshot,
		};
	}, [connections]);

	return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
