import { Emitter } from '@rocket.chat/emitter';

import { MediaStreamWrapper } from './MediaStreamWrapper';
import type { IMediaSignalLogger } from '../../definition';
import type { IMediaStreamManager, MediaStreamManagerEvents } from '../../definition/media/IMediaStreamManager';
import type { MediaStreamIdentification } from '../../definition/media/MediaStreamIdentification';

export class MediaStreamManager implements IMediaStreamManager {
	public readonly emitter: Emitter<MediaStreamManagerEvents>;

	public readonly mainLocal: MediaStreamWrapper;

	public readonly screenShareLocal: MediaStreamWrapper;

	public readonly mainRemote: MediaStreamWrapper;

	public readonly screenShareRemote: MediaStreamWrapper;

	constructor(
		protected readonly peer: RTCPeerConnection,
		protected readonly logger?: IMediaSignalLogger,
	) {
		this.emitter = new Emitter();
		this.mainLocal = this.createStream(false, 'main');
		this.screenShareLocal = this.createStream(false, 'screen-share');
		this.mainRemote = this.createStream(true, 'main');
		this.screenShareRemote = this.createStream(true, 'screen-share');
	}

	public stopRemoteStreams(): void {
		this.mainRemote.stop();
		this.screenShareRemote.stop();
	}

	public setRemoteIds(streams: MediaStreamIdentification[]): void {
		for (const stream of streams) {
			this.logger?.debug('setting remote id', stream.tag, stream.id);
			const localStream = this.getRemoteStreamByTag(stream.tag);
			if (!localStream) {
				continue;
			}

			localStream.addRemoteId(stream.id);
		}
	}

	public getLocalStreamIds(): MediaStreamIdentification[] {
		return this.getLocalStreams().map((stream) => ({
			tag: stream.tag,
			id: stream.stream.id,
		}));
	}

	public addRemoteTrack(track: MediaStreamTrack, streams: readonly MediaStream[]): void {
		this.logger?.debug('addRemoteTrack', track.kind);
		const streamWrappers = this.findStreamWrappersForRemoteTrack(track, streams);

		for (const stream of streamWrappers) {
			this.logger?.debug('setRemoteTrack', stream.tag, track.kind);
			void stream.setTrack(track.kind, track);
		}
	}

	public getStreams(): MediaStreamWrapper[] {
		return [...this.getLocalStreams(), ...this.getRemoteStreams()];
	}

	public getLocalStreams(): MediaStreamWrapper[] {
		return [this.mainLocal, this.screenShareLocal];
	}

	public getRemoteStreams(): MediaStreamWrapper[] {
		return [this.mainRemote, this.screenShareRemote];
	}

	public getLocalStreamByTag(tag: string): MediaStreamWrapper | null {
		return this.getLocalStreams().find((stream) => stream.tag === tag) || null;
	}

	public getRemoteStreamByTag(tag: string): MediaStreamWrapper | null {
		return this.getRemoteStreams().find((stream) => stream.tag === tag) || null;
	}

	private findStreamWrappersForRemoteTrack(track: MediaStreamTrack, streams: readonly MediaStream[]): MediaStreamWrapper[] {
		const streamWrappers = streams
			.map((stream) => this.getRemoteStreamById(stream.id))
			.filter((wrapper) => Boolean(wrapper)) as MediaStreamWrapper[];

		if (streamWrappers.length) {
			this.logger?.debug('found stream wrappers for track');
			return streamWrappers;
		}

		// If no streams have been found by id and it's an audio track, this is probably an external call so assume the main stream
		if (track.kind === 'audio') {
			this.logger?.debug('default audio to main track');
			return [this.mainRemote];
		}

		// A video track for an unidentified stream, let's ignore it
		this.logger?.debug('unidentified stream, ignoring video track');
		return [];
	}

	private createStream(remote: boolean, tag: string): MediaStreamWrapper {
		const wrapper = new MediaStreamWrapper(remote, tag, this.peer, this.logger);

		wrapper.emitter.on('trackChanged', () => {
			this.logger?.debug('Wrapper.trackChanged', tag, remote);
			this.emitter.emit('streamChanged');
		});
		wrapper.emitter.on('stateChanged', () => {
			this.logger?.debug('Wrapper.stateChanged', tag, remote);
			this.emitter.emit('streamChanged');
		});

		return wrapper;
	}

	private getRemoteStreamById(id: string): MediaStreamWrapper | null {
		return this.getRemoteStreams().find((stream) => stream.hasRemoteId(id)) || null;
	}
}
