import { Emitter } from '@rocket.chat/emitter';

import { MediaStreamWrapper } from './MediaStreamWrapper';
import type { IMediaSignalLogger } from '../../definition';

export type MediaStreamManagerEvents = {
	streamChanged: void;
};

export class MediaStreamManager {
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

	private createStream(remote: boolean, tag: string): MediaStreamWrapper {
		const wrapper = new MediaStreamWrapper(remote, this.peer, tag, this.logger);

		wrapper.emitter.on('trackChanged', () => {
			console.log('Wrapper.trackChanged', tag, remote);
			this.emitter.emit('streamChanged');
		});
		wrapper.emitter.on('stateChanged', () => {
			console.log('Wrapper.stateChanged', tag, remote);
			this.emitter.emit('streamChanged');
		});

		return wrapper;
	}
}
