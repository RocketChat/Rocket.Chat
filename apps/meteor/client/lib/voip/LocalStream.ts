/**
 * This class is used for local stream manipulation.
 * @remarks
 * This class does not really store any local stream for the reason
 * that the local stream tracks are stored in the peer connection.
 *
 * This simply provides necessary methods for stream manipulation.
 *
 * Currently it does not use any of its base functionality. Nevertheless
 * there might be a need that we may want to do some stream operations
 * such as closing of tracks, in future. For that purpose, it is written
 * this way.
 *
 */

import type { Session } from 'sip.js';
import type { MediaStreamFactory, SessionDescriptionHandler } from 'sip.js/lib/platform/web';
import { defaultMediaStreamFactory } from 'sip.js/lib/platform/web';

import Stream from './Stream';

export default class LocalStream extends Stream {
	static async requestNewStream(constraints: MediaStreamConstraints, session: Session): Promise<MediaStream | undefined> {
		const factory: MediaStreamFactory = defaultMediaStreamFactory();
		if (session?.sessionDescriptionHandler) {
			return factory(constraints, session.sessionDescriptionHandler as SessionDescriptionHandler);
		}
	}

	static async replaceTrack(peerConnection: RTCPeerConnection, newStream: MediaStream, mediaType?: 'audio' | 'video'): Promise<boolean> {
		const senders = peerConnection.getSenders();
		if (!senders) {
			return false;
		}
		/**
		 * This will be called when media device change happens.
		 * This needs to be called externally when the device change occurs.
		 * This function first acquires the new stream based on device selection
		 * and then replaces the track in the sender of existing stream by track acquired
		 * by caputuring new stream.
		 *
		 * Notes:
		 * Each sender represents a track in the RTCPeerConnection.
		 * Peer connection will contain single track for
		 * each, audio, video and data.
		 * Furthermore, We are assuming that
		 * newly captured stream will have a single track for each media type. i.e
		 * audio video and data. But this assumption may not be true atleast in theory. One may see multiple
		 * audio track in the captured stream or multiple senders for same kind in the peer connection
		 * If/When such situation arrives in future, we may need to revisit the track replacement logic.
		 * */

		switch (mediaType) {
			case 'audio': {
				let replaced = false;
				const newTracks = newStream.getAudioTracks();
				if (!newTracks) {
					console.warn('replaceTrack() : No audio tracks in the stream. Returning');
					return false;
				}
				for (let i = 0; i < senders?.length; i++) {
					if (senders[i].track?.kind === 'audio') {
						senders[i].replaceTrack(newTracks[0]);
						replaced = true;
						break;
					}
				}
				return replaced;
			}
			case 'video': {
				let replaced = false;
				const newTracks = newStream.getVideoTracks();
				if (!newTracks) {
					console.warn('replaceTrack() : No video tracks in the stream. Returning');
					return false;
				}
				for (let i = 0; i < senders?.length; i++) {
					if (senders[i].track?.kind === 'video') {
						senders[i].replaceTrack(newTracks[0]);
						replaced = true;
						break;
					}
				}
				return replaced;
			}
			default: {
				let replaced = false;
				const newTracks = newStream.getVideoTracks();
				if (!newTracks) {
					console.warn('replaceTrack() : No tracks in the stream. Returning');
					return false;
				}
				for (let i = 0; i < senders?.length; i++) {
					for (let j = 0; j < newTracks.length; j++) {
						if (senders[i].track?.kind === newTracks[j].kind) {
							senders[i].replaceTrack(newTracks[j]);
							replaced = true;
							break;
						}
					}
				}
				return replaced;
			}
		}
	}
}
