import { ReactiveVar } from 'meteor/reactive-var';

export const VideoRecorder = new (class VideoRecorder {
	constructor() {
		this.started = false;
		this.cameraStarted = new ReactiveVar(false);
		this.recording = new ReactiveVar(false);
		this.recordingAvailable = new ReactiveVar(false);
	}

	start(videoel, cb) {
		this.videoel = videoel;

		const handleSuccess = (stream) => {
			this.startUserMedia(stream);
			cb && cb.call(this, true);
		};

		const handleError = (error) => {
			console.error(error);
			cb && cb.call(this, false);
		};

		const oldGetUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

		if (navigator.mediaDevices) {
			navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(handleSuccess, handleError);
			return;
		}
		if (oldGetUserMedia) {
			oldGetUserMedia.call(navigator, { audio: true, video: true }, handleSuccess, handleError);
			return;
		}

		cb && cb.call(this, false);
	}

	record() {
		this.chunks = [];
		if (this.stream == null) {
			return;
		}

		this.mediaRecorder = new window.MediaRecorder(this.stream, { mimeType: 'video/webm; codecs=vp8,opus' });
		this.mediaRecorder.ondataavailable = (blobev) => {
			this.chunks.push(blobev.data);
			if (!this.recordingAvailable.get()) {
				return this.recordingAvailable.set(true);
			}
		};
		this.mediaRecorder.start();
		return this.recording.set(true);
	}

	startUserMedia(stream) {
		this.stream = stream;

		try {
			this.videoel.srcObject = stream;
		} catch (error) {
			const URL = window.URL || window.webkitURL;
			this.videoel.src = URL.createObjectURL(stream);
		}

		this.videoel.muted = true;
		this.videoel.onloadedmetadata = () => {
			this.videoel && this.videoel.play();
		};

		this.started = true;
		return this.cameraStarted.set(true);
	}

	stop(cb) {
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

		delete this.recorder;
		delete this.stream;
		delete this.videoel;
	}

	stopRecording() {
		if (!this.started || !this.recording || !this.mediaRecorder) {
			return;
		}

		this.mediaRecorder.stop();
		this.recording.set(false);
		delete this.mediaRecorder;
	}
})();
