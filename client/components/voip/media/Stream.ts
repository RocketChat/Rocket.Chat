export default class Stream {
	private mediaStream: MediaStream | undefined;

	private renderingMediaElement: HTMLMediaElement | undefined;

	constructor(mediaStream: MediaStream) {
		this.mediaStream = mediaStream;
	}

	private stopTracks(): void {
		const tracks = this.mediaStream?.getTracks();
		if (tracks) {
			for (let i = 0; i < tracks?.length; i++) {
				tracks[i].stop();
			}
		}
	}

	onTrackAdded(callBack: any): void {
		this.mediaStream?.onaddtrack?.(callBack);
	}

	onTrackRemoved(callBack: any): void {
		this.mediaStream?.onremovetrack?.(callBack);
	}

	init(rmElement: HTMLMediaElement): void {
		this.renderingMediaElement = rmElement;
	}

	play(autoPlay = true, muteAudio = false): void {
		if (this.renderingMediaElement && this.mediaStream) {
			this.renderingMediaElement.autoplay = autoPlay;
			this.renderingMediaElement.srcObject = this.mediaStream;
			if (autoPlay) {
				this.renderingMediaElement.play().catch((error: Error) => {
					console.log('Failed to play remote media');
					console.log(error.message);
					throw Error;
				});
			}
			if (muteAudio) {
				this.renderingMediaElement.volume = 0;
			}
		}
	}

	pause(): void {
		this.renderingMediaElement?.pause();
	}

	clear(): void {
		if (this.renderingMediaElement && this.mediaStream) {
			this.renderingMediaElement.pause();
			this.renderingMediaElement.srcObject = null;
			this.stopTracks();
			this.mediaStream = undefined;
		}
	}
}
