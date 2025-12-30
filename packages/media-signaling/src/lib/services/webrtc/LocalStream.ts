import { Stream } from './Stream';

export class LocalStream extends Stream {
	public async setLocalTrack(newTrack: MediaStreamTrack | null, kind: 'audio' | 'video' = 'audio'): Promise<void> {
		if (newTrack && newTrack.kind !== kind) {
			return;
		}

		this.logger?.debug('LocalStream.setLocalTrack', kind);

		if (newTrack) {
			const matchingTrack = this.mediaStream.getTrackById(newTrack.id);
			if (matchingTrack) {
				matchingTrack.enabled = this.enabled;
				return;
			}

			newTrack.enabled = this.enabled;
		}

		this.removeTracks(kind);

		if (newTrack) {
			this.mediaStream.addTrack(newTrack);
			await this.setRemoteTrack(newTrack, kind);
		} else if (kind === 'video') {
			await this.setRemoteTrack(newTrack, kind);
		}
	}

	private async setRemoteTrack(newTrack: MediaStreamTrack | null, kind: 'audio' | 'video' = 'audio'): Promise<void> {
		// If the peer doesn't yet have any track of this kind, send it to them
		this.logger?.debug('LocalStream.setRemoteTrack', kind);
		const sender = this.peer.getSenders().find((sender) => sender.track?.kind === kind);
		if (!sender) {
			if (newTrack) {
				this.logger?.debug('LocalStream.setRemoteTrack.addTrack', kind);
				// This will require a re-negotiation
				this.peer.addTrack(newTrack, this.mediaStream);
			}
			return;
		}

		// If the peer already has a track of the same kind, we can just replace it with the new track with no issues
		await sender.replaceTrack(newTrack);
	}
}
