/**
 * This class is used for stream manipulation.
 * @remarks
 * This class wraps up browser media stream and HTMLMedia element
 * and takes care of rendering the media on a given element.
 * This provides enough abstraction so that the higher level
 * classes do not need to know about the browser specificities for
 * media.
 * This will also provide stream related functionalities such as
 * mixing of 2 streams in to 2, adding/removing tracks, getting a track information
 * detecting voice energy etc. Which will be implemented as when needed
 */
import { Logger } from '../../../../lib/Logger';

export default class Stream {
	logger: Logger | undefined;

	private mediaStream: MediaStream | undefined;

	private renderingMediaElement: HTMLMediaElement | undefined;

	constructor(mediaStream: MediaStream) {
		this.mediaStream = mediaStream;
		this.logger = new Logger('Stream');
	}
	/**
	 * Called for stopping the tracks in a given stream.
	 * @remarks
	 * All the tracks from a given stream will be stopped.
	 */

	private stopTracks(): void {
		this.logger?.info('stopTrack() total tracks = ', this.mediaStream?.getTracks().length);
		const tracks = this.mediaStream?.getTracks();
		if (tracks) {
			for (let i = 0; i < tracks?.length; i++) {
				tracks[i].stop();
			}
		}
	}

	/**
	 * Called for setting the callback when the track gets added
	 * @remarks
	 */

	onTrackAdded(callBack: any): void {
		this.logger?.debug('onTrackAdded()');
		this.mediaStream?.onaddtrack?.(callBack);
	}

	/**
	 * Called for setting the callback when the track gets removed
	 * @remarks
	 */

	onTrackRemoved(callBack: any): void {
		this.logger?.debug('onTrackRemoved()');
		this.mediaStream?.onremovetrack?.(callBack);
	}

	/**
	 * Called for initializing the class
	 * @remarks
	 */

	init(rmElement: HTMLMediaElement): void {
		this.logger?.debug('init()');
		this.renderingMediaElement = rmElement;
	}
	/**
	 * Called for playing the stream
	 * @remarks
	 * Plays the stream on media element. Stream will be autoplayed and muted based on the settings.
	 * throws and error if the play fails.
	 */

	play(autoPlay = true, muteAudio = false): void {
		this.logger?.debug('play() autoPlay = ', autoPlay, 'muteAudio = ', muteAudio);
		if (this.renderingMediaElement && this.mediaStream) {
			this.renderingMediaElement.autoplay = autoPlay;
			this.renderingMediaElement.srcObject = this.mediaStream;
			if (autoPlay) {
				this.renderingMediaElement.play().catch((error: Error) => {
					this.logger?.error('play() error = ', error);
					throw error;
				});
			}
			if (muteAudio) {
				this.renderingMediaElement.volume = 0;
			}
		}
	}

	/**
	 * Called for pausing the stream
	 * @remarks
	 */
	pause(): void {
		this.logger?.debug('pause()');
		this.renderingMediaElement?.pause();
	}

	/**
	 * Called for clearing the streams and media element.
	 * @remarks
	 * This function stops the media element play, clears the srcObject
	 * stops all the tracks in the stream and sets media stream to undefined.
	 * This function ususally gets called when call ends or to clear the previous stream
	 * when the stream is switched to another stream.
	 */

	clear(): void {
		this.logger?.debug('clear()');
		if (this.renderingMediaElement && this.mediaStream) {
			this.renderingMediaElement.pause();
			this.renderingMediaElement.srcObject = null;
			this.stopTracks();
			this.mediaStream = undefined;
		}
	}
}
