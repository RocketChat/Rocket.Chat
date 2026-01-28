import { Emitter } from '@rocket.chat/emitter';

import { MediaStreamTrackWrapper } from './MediaStreamTrackWrapper';
import type { IMediaSignalLogger } from '../../definition/logger';
import type { IMediaStreamWrapper, MediaStreamEvents } from '../../definition/media/IMediaStreamWrapper';

export class MediaStreamWrapper implements IMediaStreamWrapper {
	public readonly emitter: Emitter<MediaStreamEvents>;

	public readonly remote: boolean;

	public get local(): boolean {
		return !this.remote;
	}

	public readonly stream: MediaStream;

	public get localId(): string {
		return this.stream.id;
	}

	private _active: boolean;

	public get active(): boolean {
		return this._active;
	}

	private audioEnabled = true;

	private audioTrack: MediaStreamTrackWrapper | null = null;

	private videoTrack: MediaStreamTrackWrapper | null = null;

	private stopped = false;

	private remoteIds: string[];

	constructor(
		remote: boolean,
		public readonly tag: string,
		private readonly peer: RTCPeerConnection,
		private readonly logger?: IMediaSignalLogger,
	) {
		this.remote = remote;
		this.stream = new MediaStream();
		this.emitter = new Emitter();
		this.remoteIds = [];

		// Main stream initiates as active, any other initiates as inactive
		this._active = tag === 'main';
	}

	public hasAudio(): boolean {
		if (!this.audioTrack || this.audioTrack.ended) {
			return false;
		}

		const tracks = this.stream.getAudioTracks() || [];
		if (!tracks?.length) {
			return false;
		}

		return true;
	}

	public hasVideo(): boolean {
		if (!this.videoTrack || this.videoTrack.ended) {
			return false;
		}

		const tracks = this.stream.getVideoTracks() || [];
		if (!tracks?.length) {
			return false;
		}

		return true;
	}

	public isAudioMuted(): boolean {
		if (!this.audioTrack) {
			return false;
		}

		return this.audioTrack.muted || !this.audioEnabled;
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

	public setActive(active: boolean) {
		if (this._active === active) {
			return;
		}

		this._active = active;
		this.emitter.emit('stateChanged');
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

	public addRemoteId(id: string): void {
		if (this.hasRemoteId(id)) {
			return;
		}

		this.remoteIds.push(id);
	}

	public hasRemoteId(id: string): boolean {
		return this.remoteIds.includes(id);
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
		}

		this.wrapTrack(kind, newTrack);

		await this.syncTrackChange(kind, newTrack);
		this.emitter.emit('trackChanged', { track: newTrack, kind });
	}

	private async syncTrackChange(kind: MediaStreamTrack['kind'], track: MediaStreamTrack | null): Promise<void> {
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

	private wrapTrack(kind: MediaStreamTrack['kind'], track: MediaStreamTrack | null) {
		const wrapper = track ? new MediaStreamTrackWrapper(track) : null;

		if (kind === 'audio') {
			this.audioTrack = wrapper;

			if (this.local && wrapper) {
				wrapper.enabled = this.audioEnabled;
			}
		} else {
			this.videoTrack = wrapper;
		}

		if (!wrapper) {
			return;
		}

		wrapper.emitter.on('mute', () => {
			this.emitter.emit('stateChanged');
		});

		wrapper.emitter.on('unmute', () => {
			this.emitter.emit('stateChanged');
		});

		wrapper.emitter.on('ended', () => {
			this.emitter.emit('stateChanged');
		});
	}

	private isSameTrack(trackId: string): boolean {
		return Boolean(this.stream.getTrackById(trackId));
	}
}
