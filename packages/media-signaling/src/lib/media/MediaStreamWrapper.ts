import { Emitter } from '@rocket.chat/emitter';

import { MediaStreamTrackWrapper } from './MediaStreamTrackWrapper';
import type { IMediaSignalLogger } from '../../definition/logger';
import type { IMediaStreamWrapper, MediaStreamEvents } from '../../definition/media/IMediaStreamWrapper';

const AUDIO_STATS_INTERVAL = 50;

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

	private _audioStatsTracker: ReturnType<typeof setTimeout> | null;

	private _audioLevel: number;

	public get audioLevel(): number {
		return this._audioLevel;
	}

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
		this._audioLevel = 0;
		this._audioStatsTracker = null;

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

	public isAudioMutedBySystem(): boolean {
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
		const wasMuted = this.isAudioMutedBySystem();

		this.audioEnabled = enabled;
		if (this.audioTrack) {
			this.audioTrack.enabled = enabled;
		}

		if (this.isAudioMutedBySystem() !== wasMuted) {
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
		this.audioTrack?.clear();
		this.videoTrack?.clear();
		this.unregisterAudioLevelTracker();
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

		tracks.forEach((track) => {
			if (track) {
				this.stream.removeTrack(track);
			}
		});
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

		const oldWrapper = this.getWrappedTrack(kind);
		if (oldWrapper) {
			oldWrapper.clear();
		}

		if (kind === 'audio') {
			this.audioTrack = wrapper;

			if (this.local && wrapper) {
				wrapper.enabled = this.audioEnabled;
			}

			if (wrapper && !this.stopped && !this._audioStatsTracker) {
				this.registerAudioLevelTracker();
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

	private getWrappedTrack(kind: MediaStreamTrack['kind']): MediaStreamTrackWrapper | null {
		if (kind !== 'audio') {
			return this.videoTrack;
		}

		return this.audioTrack;
	}

	private registerAudioLevelTracker() {
		if (this._audioStatsTracker) {
			this.unregisterAudioLevelTracker();
		}

		this._audioStatsTracker = setTimeout(() => this.collectAudioStats(), AUDIO_STATS_INTERVAL);
	}

	private async collectAudioStats() {
		this._audioStatsTracker = null;

		if (!this.audioTrack) {
			this._audioLevel = 0;
			this.registerAudioLevelTracker();
			return;
		}

		try {
			const stats = await this.peer.getStats(this.audioTrack.track);

			if (!stats) {
				return;
			}

			const relevantReportType = this.local ? 'media-source' : 'inbound-rtp';

			// stats is an object that has a forEach function
			stats.forEach((report) => {
				if (report.kind !== 'audio') {
					return;
				}

				if (report.type !== relevantReportType) {
					return;
				}

				this._audioLevel = report.audioLevel ?? 0;
			});
		} catch {
			this._audioLevel = 0;
		}

		// Ensure that the countdown for the next iteration only starts after fully processing the current one
		this.registerAudioLevelTracker();
	}

	private unregisterAudioLevelTracker() {
		if (!this._audioStatsTracker) {
			return;
		}

		clearTimeout(this._audioStatsTracker);
		this._audioStatsTracker = null;
		this._audioLevel = 0;
	}
}
