import { AudioEncoder } from './AudioEncoder';
import { settings } from '../../../../settings/client';

export class AudioRecorder {
	private audioContext: AudioContext | undefined;

	private stream: MediaStream | undefined;

	private encoder: AudioEncoder | undefined;

	isSupported() {
		return Boolean(navigator.mediaDevices?.getUserMedia) && Boolean(AudioContext);
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

		this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
		this.encoder = new AudioEncoder(input, { bitRate: settings.get('Message_Audio_bitRate') || 32 });
	}

	destroyEncoder() {
		if (!this.encoder) {
			return;
		}

		this.encoder.close();
		delete this.encoder;
	}

	async start(cb?: (this: this, done: boolean) => void) {
		try {
			this.createAudioContext();
			await this.createStream();
			await this.createEncoder();
			cb?.call(this, true);
		} catch (error) {
			console.error(error);
			this.destroyEncoder();
			this.destroyStream();
			this.destroyAudioContext();
			cb?.call(this, false);
		}
	}

	stop(cb: (data: Blob) => void) {
		this.encoder?.on('encoded', cb);
		this.encoder?.close();

		this.destroyEncoder();
		this.destroyStream();
		this.destroyAudioContext();
	}
}
