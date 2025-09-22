import { Stream } from './Stream';

export class RemoteStream extends Stream {
	public setTrack(newTrack: MediaStreamTrack): void {
		this.setAudioTrack(newTrack);
	}
}
