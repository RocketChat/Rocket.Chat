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
		this.removeTracks('audio');
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

	protected removeTracks(kind: 'audio' | 'video' = 'audio'): void {
		this.logger?.debug('Stream.removeTracks', kind);

		const tracks = kind === 'video' ? this.mediaStream.getVideoTracks() : this.mediaStream.getAudioTracks();

		tracks.forEach((track) => {
			if (!track) {
				return;
			}

			this.mediaStream.removeTrack(track);
		});
	}
}
