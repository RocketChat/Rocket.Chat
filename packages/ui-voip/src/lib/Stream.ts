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
export default class Stream {
	protected mediaStream: MediaStream | undefined;

	constructor(mediaStream: MediaStream) {
		this.mediaStream = mediaStream;
	}
	/**
	 * Called for stopping the tracks in a given stream.
	 * @remarks
	 * All the tracks from a given stream will be stopped.
	 */

	private stopTracks(): void {
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
		this.mediaStream?.onaddtrack?.(callBack);
	}

	/**
	 * Called for setting the callback when the track gets removed
	 * @remarks
	 */

	onTrackRemoved(callBack: any): void {
		this.mediaStream?.onremovetrack?.(callBack);
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
		if (this.mediaStream) {
			this.stopTracks();
			this.mediaStream = undefined;
		}
	}
}
