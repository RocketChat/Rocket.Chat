import { AudioEncoder } from './recorder';

const getUserMedia = ((navigator) => {
	if (navigator.mediaDevices) {
		return navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
	}

	const legacyGetUserMedia = navigator.getUserMedia ||
		navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

	if (legacyGetUserMedia) {
		return (options) => new Promise((resolve, reject) => {
			legacyGetUserMedia.call(navigator, options, resolve, reject);
		});
	}
})(window.navigator);

const AudioContext = window.AudioContext || window.webkitAudioContext;

class AudioRecorder {
	isSupported() {
		return Boolean(getUserMedia);
	}

	createAudioContext() {
		if (this.audioContext) {
			return;
		}

		this.audioContext = new AudioContext;
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

		const input = this.audioContext.createMediaStreamSource(this.stream);
		this.encoder = new AudioEncoder(input, {
			workerPath: 'mp3-realtime-worker.js',
			numChannels: 1,
		});
	}

	destroyEncoder() {
		delete this.encoder;
	}

	async start(cb) {
		try {
			await this.createAudioContext();
			await this.createStream();
			await this.createEncoder();
			this.encoder.record();
			cb && cb.call(this, true);
		} catch (error) {
			console.error(error);
			this.encoder.stop();
			this.destroyEncoder();
			this.destroyStream();
			this.destroyAudioContext();
			cb && cb.call(this, false);
		}
	}

	stop(cb) {
		this.encoder.stop();
		cb && this.encoder.exportMP3(cb);

		this.destroyEncoder();
		this.destroyStream();
		this.destroyAudioContext();
	}
}

const instance = new AudioRecorder;

export { instance as AudioRecorder };
