import { Stream } from './Stream';

export class LocalStream extends Stream {
	public get muted(): boolean {
		return !this.enabled;
	}

	public setMuted(muted: boolean): void {
		if (muted) {
			this.disable();
		} else {
			this.enable();
		}
	}

	public async setTrack(newTrack: MediaStreamTrack | null, peer: RTCPeerConnection): Promise<void> {
		if (newTrack) {
			const matchingTrack = this.mediaStream.getTrackById(newTrack.id);
			if (matchingTrack) {
				matchingTrack.enabled = this.enabled;
				return;
			}

			newTrack.enabled = this.enabled;
		}

		this.removeAudioTracks();
		if (newTrack) {
			this.mediaStream.addTrack(newTrack);
		}

		this.setRemoteTrack(newTrack, peer);
	}

	private async setRemoteTrack(newTrack: MediaStreamTrack | null, peer: RTCPeerConnection): Promise<void> {
		// If the peer doesn't yet have any audio track, send it to them
		const sender = peer.getSenders().find((sender) => sender.track?.kind === 'audio');
		if (!sender) {
			if (newTrack) {
				// This will require a re-negotiation
				peer.addTrack(newTrack, this.mediaStream);
			}
			return;
		}

		// If the peer already has a track of the same kind, we can just replace it with the new track with no issues
		await sender.replaceTrack(newTrack);
	}
}
