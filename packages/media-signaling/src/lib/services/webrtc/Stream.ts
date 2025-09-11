export class Stream {
	protected mediaStream: MediaStream;

	protected enabled: boolean;

	constructor(mediaStream: MediaStream) {
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
		this.mediaStream.getAudioTracks().forEach((track) => {
			if (!track) {
				return;
			}

			track.enabled = this.enabled;
		});
	}

	protected removeAudioTracks(): void {
		this.mediaStream.getAudioTracks().forEach((track) => {
			if (!track) {
				return;
			}

			this.mediaStream.removeTrack(track);
		});
	}

	protected setAudioTrack(newTrack: MediaStreamTrack): void {
		if (newTrack?.kind !== 'audio') {
			return;
		}

		if (this.mediaStream.getTrackById(newTrack.id)) {
			return;
		}

		this.removeAudioTracks();
		this.mediaStream.addTrack(newTrack);
		newTrack.enabled = this.enabled;
	}
}
