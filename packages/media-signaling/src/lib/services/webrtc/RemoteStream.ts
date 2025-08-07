import { Stream } from './Stream';

export class RemoteStream extends Stream {
	public setTrack(newTrack: MediaStreamTrack, _peer: RTCPeerConnection): void {
		if (this.mediaStream.getTrackById(newTrack.id)) {
			return;
		}

		if (newTrack.kind !== 'audio') {
			return;
		}

		this.mediaStream.getAudioTracks().forEach((track) => {
			track.stop();
			this.mediaStream.removeTrack(track);
		});

		this.mediaStream.addTrack(newTrack);
	}
}
