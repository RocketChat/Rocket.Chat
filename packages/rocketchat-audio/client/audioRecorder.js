/* globals Recorder RCMediaRecorder */
this.AudioRecorder = new class {
	start(cb, config) {
		config = config || {};
		const options = {};
		options.format = config.format || 'mp3';
		this.options = options;

		if (this.options.format === 'mp3') {
			window.AudioContext = window.AudioContext || window.webkitAudioContext;
			navigator.getUserMedia = navigator.getUserMedia ||
				navigator.webkitGetUserMedia ||
				navigator.mozGetUserMedia ||
				navigator.msGetUserMedia;
			window.audioContext = new AudioContext;
			const ok = stream => {
				this.startUserMedia(stream);
				return (cb != null ? cb(this) : undefined);
			};

			if ((navigator.getUserMedia == null)) {
				return cb(false);
			}

			return navigator.getUserMedia({audio: true}, ok, e => console.log(`No live audio input: ${ e }`));
		} else if (this.options.format === 'ogg') {
			this.recorder = new RCMediaRecorder();
			this.recorder.start();
			cb(this);
		} else {
			cb(false);
		}
	}

	startUserMedia(stream) {
		this.stream = stream;
		const input = window.audioContext.createMediaStreamSource(stream);
		this.recorder = new Recorder(input);
		return this.recorder.record();
	}

	stop(cb) {
		if (this.options.format === 'mp3') {

			this.recorder.stop(cb);
			this.stream.getAudioTracks()[0].stop();
			window.audioContext.close();
			delete window.audioContext;
			delete this.recorder;
			return delete this.stream;
		} else if (this.options.format === 'ogg') {
			this.recorder.end(cb);
		}
	}

};
