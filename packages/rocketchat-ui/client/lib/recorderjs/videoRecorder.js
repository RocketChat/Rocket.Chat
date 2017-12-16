this.VideoRecorder = new class {
	constructor() {
		this.started = false;
		this.cameraStarted = new ReactiveVar(false);
		this.recording = new ReactiveVar(false);
		this.recordingAvailable = new ReactiveVar(false);
	}

	start(videoel, cb) {
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
		window.URL = window.URL || window.webkitURL;

		this.videoel = videoel;
		const ok = stream => {
			this.startUserMedia(stream);
			return (cb != null ? cb.call(this) : undefined);
		};

		if (navigator.getUserMedia == null) {
			return cb(false);
		}

		return navigator.getUserMedia({audio: true, video: true}, ok, e => console.log(`No live video input: ${ e }`));
	}

	record() {
		this.chunks = [];
		if (this.stream == null) {
			return;
		}
		this.mediaRecorder = new MediaRecorder(this.stream);
		this.mediaRecorder.stream = this.stream;
		this.mediaRecorder.mimeType = 'video/webm';
		this.mediaRecorder.ondataavailable = blobev => {
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
		this.videoel.src = URL.createObjectURL(stream);
		this.videoel.onloadedmetadata = () => {
			return this.videoel.play();
		};

		this.started = true;
		return this.cameraStarted.set(true);
	}

	stop(cb) {
		if (this.started) {
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
				const blob = new Blob(this.chunks, { 'type' :  'video/webm' });
				cb(blob);
			}

			delete this.recorder;
			delete this.stream;
			return delete this.videoel;
		}
	}

	stopRecording() {
		if (this.started && this.recording && this.mediaRecorder) {
			this.mediaRecorder.stop();
			this.recording.set(false);
			return delete this.mediaRecorder;
		}
	}
};
