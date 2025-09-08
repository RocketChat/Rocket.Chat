import { Stream } from './Stream';

export class RemoteStream extends Stream {
	public setTrack(newTrack: MediaStreamTrack, _peer: RTCPeerConnection): void {
		this.setAudioTrack(newTrack);
	}
}
