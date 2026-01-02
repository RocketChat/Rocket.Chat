import { Emitter } from '@rocket.chat/emitter';

import type { IMediaSignalLogger } from '../../definition/logger';

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
export class MediaStreamWrapper {
	public readonly emitter: Emitter<MediaStreamEvents>;

	public readonly remote: boolean;

	public get local(): boolean {
		return !this.remote;
	}

	public readonly tag: string | null;

	public readonly stream: MediaStream;

	public get audioLevel(): number {
		return 0;
	}

	/**
	 * indicates if the audio track is enabled by the rocket.chat client (aka not muted by the user nor placed on hold)
	 * */
	private audioEnabled = true;

	/**
	 * indicates if the audio track is muted on a lower level than what rocket.chat can control (aka muted by the OS or by the peer)
	 * */
	private audioMuted = false;

	private audioTrack: MediaStreamTrack | null = null;

	private videoMuted = false;

	private videoTrack: MediaStreamTrack | null = null;

	private stopped = false;

	constructor(
		remote: boolean,
		private readonly peer: RTCPeerConnection,
		tag?: string,
		private readonly logger?: IMediaSignalLogger,
	) {
		this.remote = remote;
		this.tag = tag || null;
		this.stream = new MediaStream();
		this.emitter = new Emitter();
	}

	public hasAudio(): boolean {
		return false;
	}

	public hasVideo(): boolean {
		if (!this.videoTrack || this.videoMuted) {
			return false;
		}

		const tracks = this.stream.getVideoTracks() || [];
		if (!tracks?.length) {
			return false;
		}

		return true;
	}

	public isAudioMuted(): boolean {
		return this.audioMuted || !this.audioEnabled;
	}

	public isAudioEnabled(): boolean {
		if (this.audioTrack) {
			return this.audioTrack.enabled;
		}

		return this.audioEnabled;
	}

	public isStopped(): boolean {
		return this.stopped;
	}

	public setAudioEnabled(enabled: boolean) {
		const wasMuted = this.isAudioMuted();

		this.audioEnabled = enabled;
		if (this.audioTrack) {
			this.audioTrack.enabled = enabled;
		}

		if (this.isAudioMuted() !== wasMuted) {
			this.emitter.emit('stateChanged');
		}
	}

	public stop(): void {
		this.stopped = true;
		this.removeTracks();
	}

	public async setTrack(kind: MediaStreamTrack['kind'], track: MediaStreamTrack | null): Promise<void> {
		this.logger?.debug('BaseMediaStream.setTrack', kind, this.remote, this.tag);

		if (track && this.isSameTrack(track.id)) {
			return;
		}

		await this.replaceTrack(kind, track);
	}

	private getTracks(kind?: MediaStreamTrack['kind'] | null): MediaStreamTrack[] {
		switch (kind) {
			case 'audio':
				return this.stream.getAudioTracks();
			case 'video':
				return this.stream.getVideoTracks();
			default:
				return this.stream.getTracks();
		}
	}

	private removeTracks(kind?: MediaStreamTrack['kind']): void {
		const tracks = this.getTracks(kind);

		tracks.forEach((track) => track && this.stream.removeTrack(track));
	}

	private async replaceTrack(kind: MediaStreamTrack['kind'], newTrack: MediaStreamTrack | null): Promise<void> {
		this.removeTracks(kind);

		if (newTrack) {
			this.stream.addTrack(newTrack);

			newTrack.onmute = (_ev) => {
				if (newTrack === this.audioTrack) {
					this.audioMuted = true;
				} else if (newTrack === this.videoTrack) {
					this.videoMuted = true;
				}

				console.log('track.onmute', this.remote, this.tag, newTrack.kind);
				this.emitter.emit('stateChanged');
			};
			newTrack.onunmute = (_ev) => {
				if (newTrack === this.audioTrack) {
					this.audioMuted = false;
				} else if (newTrack === this.videoTrack) {
					this.videoMuted = false;
				}
				console.log('track.onunmute', this.remote, this.tag, newTrack.kind);
				this.emitter.emit('stateChanged');
			};
			newTrack.onended = (_ev) => {
				console.log('track.onended', this.remote, this.tag, newTrack.kind);
				this.emitter.emit('stateChanged');
			};
		}

		if (kind === 'audio') {
			if (this.local && newTrack) {
				newTrack.enabled = this.audioEnabled;
			}

			this.audioTrack = newTrack;
			this.audioMuted = newTrack?.muted ?? false;
		} else if (kind === 'video') {
			this.videoTrack = newTrack;
			this.videoMuted = newTrack?.muted ?? false;
		}

		await this.syncTrackChange(newTrack, kind);
		this.emitter.emit('trackChanged', { track: newTrack, kind });
	}

	private async syncTrackChange(track: MediaStreamTrack | null, kind: MediaStreamTrack['kind']): Promise<void> {
		if (this.remote) {
			return;
		}
		this.logger?.debug('MediaStreamWrapper.setPeerTrack', kind, JSON.stringify(this.peer.getSenders()));

		// If the peer doesn't yet have any track of this kind, add as a new one
		const sender = this.peer.getSenders().find((sender) => sender.track?.kind === kind);
		if (!sender) {
			if (track) {
				this.logger?.debug('MediaStreamWrapper.setPeerTrack.addTrack', kind);
				// This will require a re-negotiation
				this.peer.addTrack(track, this.stream);
			}
			return;
		}

		// If the peer already has a track of the same kind, we can just replace it with the new track with no issues
		// TODO: safe guard against edge cases where this would fail (eg: changing number of audio channels or increasing video quality)
		await sender.replaceTrack(track);
	}

	private isSameTrack(trackId: string): boolean {
		return Boolean(this.stream.getTrackById(trackId));
	}
}
