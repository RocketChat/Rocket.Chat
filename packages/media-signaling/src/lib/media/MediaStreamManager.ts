import { Emitter } from '@rocket.chat/emitter';

import { MediaStreamWrapper } from './MediaStreamWrapper';
import type { IMediaSignalLogger } from '../../definition';
import type { IMediaStreamManager, MediaStreamManagerEvents } from '../../definition/media/IMediaStreamManager';
import type { MediaStreamIdentification } from '../../definition/media/MediaStreamIdentification';

// Canonical stream tags. Aligned with LiveKit's Track.Source enum:
//   Track.Source.Microphone  → 'microphone'
//   Track.Source.Camera      → 'camera'
//   Track.Source.ScreenShare → 'screen-share'
//
// The 'main' tag is a deprecated alias for 'microphone' kept for back-compat
// during the rename pass; getLocalStreamByTag/getRemoteStreamByTag normalize it.
const TAG_MICROPHONE = 'microphone';
const TAG_CAMERA = 'camera';
const TAG_SCREEN_SHARE = 'screen-share';

const normalizeTag = (tag: string): string => (tag === 'main' ? TAG_MICROPHONE : tag);

export class MediaStreamManager implements IMediaStreamManager {
	public readonly emitter: Emitter<MediaStreamManagerEvents>;

	public readonly microphoneLocal: MediaStreamWrapper;

	public readonly screenShareLocal: MediaStreamWrapper;

	public readonly cameraLocal: MediaStreamWrapper;

	public readonly microphoneRemote: MediaStreamWrapper;

	public readonly screenShareRemote: MediaStreamWrapper;

	public readonly cameraRemote: MediaStreamWrapper;

	constructor(
		protected readonly peer: RTCPeerConnection | null,
		protected readonly logger?: IMediaSignalLogger,
	) {
		this.emitter = new Emitter();
		this.microphoneLocal = this.createStream(false, TAG_MICROPHONE);
		this.screenShareLocal = this.createStream(false, TAG_SCREEN_SHARE);
		this.cameraLocal = this.createStream(false, TAG_CAMERA);
		this.microphoneRemote = this.createStream(true, TAG_MICROPHONE);
		this.screenShareRemote = this.createStream(true, TAG_SCREEN_SHARE);
		this.cameraRemote = this.createStream(true, TAG_CAMERA);
	}

	// Deprecated aliases — prefer microphoneLocal/microphoneRemote.
	public get mainLocal(): MediaStreamWrapper {
		return this.microphoneLocal;
	}

	public get mainRemote(): MediaStreamWrapper {
		return this.microphoneRemote;
	}

	public stopRemoteStreams(): void {
		this.microphoneRemote.stop();
		this.screenShareRemote.stop();
		this.cameraRemote.stop();
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
		return [this.microphoneLocal, this.screenShareLocal, this.cameraLocal];
	}

	public getRemoteStreams(): MediaStreamWrapper[] {
		return [this.microphoneRemote, this.screenShareRemote, this.cameraRemote];
	}

	public getLocalStreamByTag(tag: string): MediaStreamWrapper | null {
		const normalized = normalizeTag(tag);
		return this.getLocalStreams().find((stream) => stream.tag === normalized) || null;
	}

	public getRemoteStreamByTag(tag: string): MediaStreamWrapper | null {
		const normalized = normalizeTag(tag);
		return this.getRemoteStreams().find((stream) => stream.tag === normalized) || null;
	}

	public hasAllRequiredTracks(): boolean {
		return this.microphoneLocal.hasAudio();
	}

	private findStreamWrappersForRemoteTrack(track: MediaStreamTrack, streams: readonly MediaStream[]): MediaStreamWrapper[] {
		const streamWrappers = streams
			.map((stream) => this.getRemoteStreamById(stream.id))
			.filter((wrapper): wrapper is MediaStreamWrapper => Boolean(wrapper));

		if (streamWrappers.length) {
			this.logger?.debug('found stream wrappers for track');
			return streamWrappers;
		}

		// If no streams have been found by id and it's an audio track, this is probably an external call so assume the microphone stream
		if (track.kind === 'audio') {
			this.logger?.debug('default audio to microphone track');
			return [this.microphoneRemote];
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
