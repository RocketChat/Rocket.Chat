import { Stream } from './Stream';

export class RemoteStream extends Stream {
	public setTrack(newTrack: MediaStreamTrack, _peer: RTCPeerConnection): void {
		console.log('setRemoteTrack');

		if (this.mediaStream.getTrackById(newTrack.id)) {
			console.log('remote track already set');
			return;
		}

		if (newTrack.kind !== 'audio') {
			console.log('received non-audio track: ', newTrack.kind);
			return;
		}

		this.mediaStream.getAudioTracks().forEach((track) => {
			track.stop();
			this.mediaStream.removeTrack(track);
		});

		this.mediaStream.addTrack(newTrack);
	}
}
