import { Stream } from './Stream';

export class LocalStream extends Stream {
	private emptyTransceiver: RTCRtpTransceiver | null = null;

	public async setTrack(newTrack: MediaStreamTrack | null, peer: RTCPeerConnection): Promise<void> {
		if (newTrack?.kind !== 'audio') {
			return;
		}

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

		await this.setRemoteTrack(newTrack, peer);
	}

	private async setRemoteTrack(newTrack: MediaStreamTrack | null, peer: RTCPeerConnection): Promise<void> {
		// If the peer doesn't yet have any audio track, send it to them
		const sender = peer.getSenders().find((sender) => sender.track?.kind === 'audio' || sender === this.emptyTransceiver?.sender);
		if (!sender) {
			if (newTrack) {
				// This will require a re-negotiation
				peer.addTrack(newTrack, this.mediaStream);
				this.emptyTransceiver = null;
			} else {
				this.emptyTransceiver = peer.addTransceiver('audio', { direction: 'sendrecv' });
			}
			return;
		}

		// If the peer already has a track of the same kind, we can just replace it with the new track with no issues
		await sender.replaceTrack(newTrack);
		if (newTrack) {
			this.emptyTransceiver = null;
		}
	}
}
