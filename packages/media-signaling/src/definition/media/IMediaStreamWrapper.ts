import type { Emitter } from '@rocket.chat/emitter';

export type MediaStreamEvents = {
	trackChanged: {
		track: MediaStreamTrack | null;
		kind: MediaStreamTrack['kind'];
	};
	stateChanged: void;
};

/**
 * An object that holds a reference to a single MediaStream, plus additional data related to that specific stream
 *
 * We make a few assumptions about the stream based on our intendend use cases; Use multiple streams if you need, but make sure each individual stream follow the rules:
 *
 * 1. A stream MAY be empty (have no tracks)
 *
 * 2. A stream MAY have both an audio track and a video track at the same time, but only if they are related
 *
 * 3. A stream MAY NOT have multiple tracks of the same kind (audio/video).
 *
 * Audio and video are related if they come from the same source. For example: if the user is sharing their screen, the stream with the video may only include audio if that audio is from the user's screen - it may not include the user's mic.
 * The audio from the user's mic and the video from the user's camera also count as being related.
 *
 * We have no control over what remote peers may send us if they are not also a rocket.chat client. If they send us multiple tracks in the same stream, we'll use the first and ignore the rest. It's likely that all tracks would have the same data anyway - just with different encodings.
 * */
export interface IMediaStreamWrapper {
	readonly emitter: Emitter<MediaStreamEvents>;

	readonly remote: boolean;

	readonly stream: MediaStream;

	readonly localId: string;

	readonly active: boolean;

	/**
	 * Indicates if there's any track on this stream that is receiving or may receive audio
	 **/
	hasAudio(): boolean;

	/**
	 * Indicates if there's any track on this stream that is receiving or may receive video
	 **/
	hasVideo(): boolean;

	/**
	 * indicates if the audio track is not receiving audio from the system or network; beyond what the rocket.chat client can control
	 * */
	isAudioMuted(): boolean;

	/**
	 * indicates if the audio track is enabled by the rocket.chat client (aka not muted by the user nor placed on hold)
	 * */
	isAudioEnabled(): boolean;

	isStopped(): boolean;
}
