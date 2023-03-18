import { AudioEncoder } from './audioEncoder';

export class AudioRecorder {
	isSupported() {
		return Boolean(navigator.mediaDevices?.getUserMedia) && Boolean(AudioContext);
	}

	createAudioContext() {
		if (this.audioContext) {
			return;
		}

		this.audioContext = new AudioContext();
		console.log(this.audioContext, 'createAudioContext');
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

		this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		console.log(this.stream, 'createStream');
	}

	destroyStream() {
		if (!this.stream) {
			return;
		}

		this.stream.getAudioTracks().forEach((track) => track.stop());
		delete this.stream;
	}

	async createEncoder() {
		if (this.encoder || !this.audioContext || !this.stream) {
			return;
		}

		const input = this.audioContext?.createMediaStreamSource(this.stream);
		this.encoder = new AudioEncoder(input, { bitRate: 32 });
		console.log(this.encoder, 'createEncoder');
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
			this.createAudioContext();
			await this.createStream();
			await this.createEncoder();
			cb?.call(this, true);
		} catch (error) {
			console.error(error.message);
			this.destroyEncoder();
			this.destroyStream();
			this.destroyAudioContext();
			console.log('Error start');
			cb?.call(this, false);
		}
	}

	stop(cb) {
		this.encoder?.on('encoded', cb);
		this.encoder?.close();

		this.destroyEncoder();
		console.log('stop');
		this.destroyStream();
		this.destroyAudioContext();
	}
}
