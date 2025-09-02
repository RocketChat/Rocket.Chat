import { Stream } from './Stream';

export class RemoteStream extends Stream {
	public get onHold(): boolean {
		return !this.enabled;
	}

	public setOnHold(onHold: boolean): void {
		if (onHold) {
			this.disable();
		} else {
			this.enable();
		}
	}

	public setTrack(newTrack: MediaStreamTrack, _peer: RTCPeerConnection): void {
		this.setAudioTrack(newTrack);
	}
}
