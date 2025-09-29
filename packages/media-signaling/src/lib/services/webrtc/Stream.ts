import type { IMediaSignalLogger } from '../../../definition';

export class Stream {
	protected mediaStream: MediaStream;

	protected enabled: boolean;

	constructor(
		mediaStream: MediaStream,
		protected readonly peer: RTCPeerConnection,
		protected readonly logger?: IMediaSignalLogger,
	) {
		this.mediaStream = mediaStream;
		this.enabled = true;
	}

	public enable(): void {
		this.setEnabled(true);
	}

	public disable(): void {
		this.setEnabled(false);
	}

	public setEnabled(enabled: boolean): void {
		this.enabled = enabled;
		this.toggleAudioTracks();
	}

	public stopAudio(): void {
		this.removeAudioTracks();
	}

	protected toggleAudioTracks(): void {
		this.logger?.debug('Stream.toggleAudioTracks', this.enabled);
		this.mediaStream.getAudioTracks().forEach((track) => {
			if (!track) {
				return;
			}

			track.enabled = this.enabled;
		});
	}

	protected removeAudioTracks(): void {
		this.logger?.debug('Stream.removeAudioTracks');
		this.mediaStream.getAudioTracks().forEach((track) => {
			if (!track) {
				return;
			}

			this.mediaStream.removeTrack(track);
		});
	}

	protected setAudioTrack(newTrack: MediaStreamTrack): boolean {
		if (newTrack.kind !== 'audio') {
			return false;
		}

		this.logger?.debug('Stream.setAudioTrack', newTrack.id);
		const matchingTrack = this.mediaStream.getTrackById(newTrack.id);
		if (matchingTrack) {
			this.logger?.debug('Stream.setAudioTrack.return', 'track found by id');
			return false;
		}

		this.removeAudioTracks();
		this.mediaStream.addTrack(newTrack);
		return true;
	}
}
