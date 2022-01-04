import { AudioEncoder } from './audioEncoder';

const getUserMedia = ((navigator) => {
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
})(window.navigator);

const AudioContext = window.AudioContext || window.webkitAudioContext;

class AudioRecorder {
	isSupported() {
		return Boolean(getUserMedia) && Boolean(AudioContext);
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

		const input = this.audioContext.createMediaStreamSource(this.stream);
		this.encoder = new AudioEncoder(input);
	}

	destroyEncoder() {
		if (!this.encoder) {
			return;
		}

		this.encoder.close();
		delete this.encoder;
	}

	async start(cb) {
		try {
			await this.createAudioContext();
			await this.createStream();
			await this.createEncoder();
			cb && cb.call(this, true);
		} catch (error) {
			console.error(error);
			this.destroyEncoder();
			this.destroyStream();
			this.destroyAudioContext();
			cb && cb.call(this, false);
		}
	}

	stop(cb) {
		this.encoder.on('encoded', cb);
		this.encoder.close();

		this.destroyEncoder();
		this.destroyStream();
		this.destroyAudioContext();
	}
}

const instance = new AudioRecorder();

export { instance as AudioRecorder };
