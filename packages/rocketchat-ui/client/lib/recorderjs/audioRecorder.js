/* globals Recorder */
this.AudioRecorder = new class {
	start(cb) {
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
		window.URL = window.URL || window.webkitURL;

		window.audioContext = new AudioContext;

		const ok = stream => {
			this.startUserMedia(stream);
			return (cb != null ? cb.call(this) : undefined);
		};

		if ((navigator.getUserMedia == null)) {
			return cb(false);
		}

		return navigator.getUserMedia({audio: true}, ok, e => console.log(`No live audio input: ${ e }`));
	}

	startUserMedia(stream) {
		this.stream = stream;
		const input = window.audioContext.createMediaStreamSource(stream);
		this.recorder = new Recorder(input, {workerPath: '/recorderWorker.js'});
		return this.recorder.record();
	}

	stop(cb) {
		this.recorder.stop();

		if (cb != null) {
			this.getBlob(cb);
		}

		this.stream.getAudioTracks()[0].stop();

		this.recorder.clear();

		window.audioContext.close();
		delete window.audioContext;
		delete this.recorder;
		return delete this.stream;
	}

	getBlob(cb) {
		return this.recorder.exportWAV(cb);
	}
};
