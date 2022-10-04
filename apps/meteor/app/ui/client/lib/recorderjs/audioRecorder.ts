import { Emitter } from '@rocket.chat/emitter';

import { AudioEncoder } from './audioEncoder';

const getUserMedia = ((navigator: any) => {
	if (navigator.mediaDevices) {
		return navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
	}

	const legacyGetUserMedia =
		navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	if (legacyGetUserMedia) {
		return (options) =>
			new Promise((resolve, reject) => {
				legacyGetUserMedia.call(navigator, options, resolve, reject);
			});
	}
})(window.navigator) as typeof navigator.mediaDevices.getUserMedia;

const AudioContext =
	window.AudioContext ||
	(
		window as unknown as {
			webkitAudioContext: typeof window.AudioContext;
		}
	).webkitAudioContext;

const isSupported = Boolean(getUserMedia) && Boolean(AudioContext);

class AudioRecorder extends Emitter<{
	state: 'recording' | 'stopped';
}> {
	public state: 'recording' | 'stopped' = 'stopped';

	private encoder?: AudioEncoder;

	private audioContext?: AudioContext;

	private stream?: MediaStream;

	private setState(state: 'recording' | 'stopped') {
		this.state = state;
		this.emit('state', state);
	}

	isSupported() {
		return isSupported;
	}

	createAudioContext() {
		if (this.audioContext) {
			return;
		}

		this.audioContext = new AudioContext();
	}

	destroyAudioContext() {
		if (!this.audioContext) {
			return;
		}

		this.audioContext.close();
		delete this.audioContext;
	}

	async createStream() {
		if (this.stream) {
			return;
		}

		this.stream = await getUserMedia({ audio: true });
	}

	destroyStream() {
		if (!this.stream) {
			return;
		}

		this.stream.getAudioTracks().forEach((track) => track.stop());
		delete this.stream;
	}

	async createEncoder() {
		if (this.encoder) {
			return;
		}

		if (!this.stream) {
			throw new Error('No stream available');
		}

		const input = this.audioContext?.createMediaStreamSource(this.stream);
		this.encoder = new AudioEncoder(input);
	}

	destroyEncoder() {
		if (!this.encoder) {
			return;
		}

		this.encoder.close();
		delete this.encoder;
	}

	async start(cb?: (state: boolean) => void) {
		try {
			await this.createAudioContext();
			await this.createStream();
			await this.createEncoder();
			this.setState('recording');
			cb?.call(this, true);
		} catch (error) {
			console.error(error);
			this.destroyEncoder();
			this.destroyStream();
			this.destroyAudioContext();
			cb?.call(this, false);
		}
	}

	stop(cb?: (blob: Blob) => void) {
		this.encoder?.on('encoded', (blob) => {
			this.setState('stopped');
			cb?.(blob);
		});
		this.encoder?.close();

		this.destroyEncoder();
		this.destroyStream();
		this.destroyAudioContext();
	}
}

const instance = new AudioRecorder();

export { instance as AudioRecorder };
