import { ReactiveVar } from 'meteor/reactive-var';

class VideoRecorder {
	public cameraStarted = new ReactiveVar(false);

	private started = false;

	private recording = new ReactiveVar(false);

	private recordingAvailable = new ReactiveVar(false);

	private videoel?: HTMLVideoElement;

	private chunks: Blob[] = [];

	private stream?: MediaStream;

	private mediaRecorder?: MediaRecorder;

	public getSupportedMimeTypes() {
		if (window.MediaRecorder.isTypeSupported('video/webm')) {
			return 'video/webm; codecs=vp8,opus';
		}
		if (window.MediaRecorder.isTypeSupported('video/mp4')) {
			return 'video/mp4';
		}
		return '';
	}

	public start(videoel?: HTMLVideoElement, cb?: (this: this, success: boolean) => void) {
		this.videoel = videoel;

		const handleSuccess = (stream: MediaStream) => {
			this.startUserMedia(stream);
			cb?.call(this, true);
		};

		const handleError = (error: any) => {
			console.error(error);
			cb?.call(this, false);
		};

		if (navigator.mediaDevices) {
			navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(handleSuccess, handleError);
			return;
		}

		const oldGetUserMedia = navigator.getUserMedia ?? navigator.webkitGetUserMedia ?? navigator.mozGetUserMedia ?? navigator.msGetUserMedia;

		if (oldGetUserMedia) {
			oldGetUserMedia.call(navigator, { audio: true, video: true }, handleSuccess, handleError);
			return;
		}

		cb?.call(this, false);
	}

	public record() {
		this.chunks = [];
		if (!this.stream) {
			return;
		}

		this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: this.getSupportedMimeTypes() });
		this.mediaRecorder.ondataavailable = (blobev) => {
			this.chunks.push(blobev.data);
			if (!this.recordingAvailable.get()) {
				return this.recordingAvailable.set(true);
			}
		};
		this.mediaRecorder.start();
		return this.recording.set(true);
	}

	private startUserMedia(stream: MediaStream) {
		if (!this.videoel) {
			return;
		}
		this.stream = stream;

		try {
			this.videoel.srcObject = stream;
		} catch (error) {
			const URL = window.URL || window.webkitURL;
			this.videoel.src = URL.createObjectURL(stream as unknown as MediaSource | Blob);
		}

		this.started = true;
		return this.cameraStarted.set(true);
	}

	public stop(cb?: (blob: Blob) => void) {
		if (!this.started) {
			return;
		}

		this.stopRecording();

		if (this.stream) {
			const vtracks = this.stream.getVideoTracks();
			for (const vtrack of Array.from(vtracks)) {
				vtrack.stop();
			}

			const atracks = this.stream.getAudioTracks();
			for (const atrack of Array.from(atracks)) {
				atrack.stop();
			}
		}

		if (this.videoel) {
			this.videoel.pause;
			this.videoel.src = '';
		}

		this.started = false;
		this.cameraStarted.set(false);
		this.recordingAvailable.set(false);

		if (cb && this.chunks) {
			const blob = new Blob(this.chunks);
			cb(blob);
		}

		delete this.stream;
		delete this.videoel;
	}

	public stopRecording() {
		if (!this.started || !this.recording || !this.mediaRecorder) {
			return;
		}

		this.mediaRecorder.stop();
		this.recording.set(false);
		delete this.mediaRecorder;
	}
}

const instance = new VideoRecorder();

export { instance as VideoRecorder };
