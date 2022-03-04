import { Session } from 'sip.js';
import { SessionDescriptionHandler } from 'sip.js/lib/platform/web';

/** Helper function to enable/disable media tracks. */
export async function toggleMediaStreamTracks(enable: boolean, session: Session, direction: 'sender' | 'receiver'): Promise<void> {
	const { sessionDescriptionHandler } = session;
	if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
		throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
	}
	const { peerConnection } = sessionDescriptionHandler;
	if (!peerConnection) {
		throw new Error('Peer connection closed.');
	}
	let mediaStreams = null;
	if (direction === 'sender') {
		mediaStreams = peerConnection.getSenders();
	} else if (direction === 'receiver') {
		mediaStreams = peerConnection.getReceivers();
	}
	if (mediaStreams) {
		mediaStreams.forEach((stream) => {
			if (stream.track) {
				stream.track.enabled = enable;
			}
		});
	}
}
