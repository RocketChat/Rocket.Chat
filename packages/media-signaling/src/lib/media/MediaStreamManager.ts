import { Emitter } from '@rocket.chat/emitter';

import { MediaStreamWrapper } from './MediaStreamWrapper';
import type { IMediaSignalLogger } from '../../definition';
import type { IMediaStreamManager, MediaStreamManagerEvents } from '../../definition/media/IMediaStreamManager';
import type { MediaStreamIdentification } from '../../definition/media/MediaStreamIdentification';
import { SDP } from '../services/webrtc';

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

	public setRemoteIdsBySDP(remoteSDP: string): void {
		const contentMap = SDP.getStreamContentMapFromSDP(remoteSDP);
		const streams: MediaStreamIdentification[] = Object.entries(contentMap)
			.map(([id, content]) => {
				const tag = this.getStreamTagByMediaContent(content);
				if (!tag) {
					return null;
				}

				return { id, tag };
			})
			.filter((stream): stream is MediaStreamIdentification => Boolean(stream));

		if (streams.length) {
			this.setRemoteIds(streams);
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

	public hasAllRequiredTracks(): boolean {
		return this.mainLocal.hasAudio();
	}

	private findStreamWrappersForRemoteTrack(track: MediaStreamTrack, streams: readonly MediaStream[]): MediaStreamWrapper[] {
		const streamWrappers = streams
			.map((stream) => this.getRemoteStreamById(stream.id))
			.filter((wrapper): wrapper is MediaStreamWrapper => Boolean(wrapper));

		if (streamWrappers.length) {
			this.logger?.debug('found stream wrappers for track');
			return streamWrappers;
		}

		// If no streams have been found by id and it's an audio track, this is probably an external call so assume the main stream
		if (track.kind === 'audio') {
			this.logger?.debug('default audio to main track');
			return [this.mainRemote];
		}

		// A video track for an unidentified stream - since the only video we support now is screen share, assume that's what this is
		this.logger?.debug('unidentified stream, assuming screen-share');
		return [this.screenShareRemote];
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

	private getStreamTagByMediaContent(content: string): string | null {
		switch (content) {
			case 'slides':
				return 'screen-share';
			case 'main':
				return 'main';
			default:
				return null;
		}
	}
}
