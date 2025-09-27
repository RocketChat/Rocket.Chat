import { Stream } from './Stream';

export class LocalStream extends Stream {
	public async setTrack(newTrack: MediaStreamTrack | null): Promise<void> {
		if (newTrack && newTrack?.kind !== 'audio') {
			return;
		}
		this.logger?.debug('LocalStream.setTrack');

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
			await this.setRemoteTrack(newTrack);
		}
	}

	private async setRemoteTrack(newTrack: MediaStreamTrack | null): Promise<void> {
		// If the peer doesn't yet have any audio track, send it to them
		this.logger?.debug('LocalStream.setRemoteTrack');
		const sender = this.peer.getSenders().find((sender) => sender.track?.kind === 'audio');
		if (!sender) {
			if (newTrack) {
				this.logger?.debug('LocalStream.setRemoteTrack.addTrack');
				// This will require a re-negotiation
				this.peer.addTrack(newTrack, this.mediaStream);
			}
			return;
		}

		// If the peer already has a track of the same kind, we can just replace it with the new track with no issues
		await sender.replaceTrack(newTrack);
	}
}
