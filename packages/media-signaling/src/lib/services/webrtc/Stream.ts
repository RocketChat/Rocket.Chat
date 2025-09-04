export class Stream {
	protected mediaStream: MediaStream;

	protected enabled: boolean;

	constructor(mediaStream: MediaStream) {
		this.mediaStream = mediaStream;
		this.enabled = true;
	}

	public enable(): void {
		this.enabled = true;
		this.toggleAudioTracks();
	}

	public disable(): void {
		this.enabled = false;
		this.toggleAudioTracks();
	}

	public setEnabled(enabled: boolean): void {
		if (enabled) {
			this.enable();
		} else {
			this.disable();
		}
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

			track.stop();
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
	}
}
