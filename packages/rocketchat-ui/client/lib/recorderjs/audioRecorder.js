// TODO: embed Recorder class here
// TODO: create the worker for mp3 encoding on-the-fly
export const AudioRecorder = new (class AudioRecorder {
	start(cb) {
		window.audioContext = new (window.AudioContext || window.webkitAudioContext);

		const handleSuccess = (stream) => {
			this.startUserMedia(stream);
			cb && cb.call(this, true);
		};

		const handleError = (error) => {
			console.error(error);
			cb && cb.call(this, false);
		};

		const oldGetUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
			navigator.msGetUserMedia;

		if (navigator.mediaDevices) {
			navigator.mediaDevices.getUserMedia({ audio: true })
				.then(handleSuccess, handleError);
			return;
		} else if (oldGetUserMedia) {
			oldGetUserMedia.call(navigator, { audio: true }, handleSuccess, handleError);
			return;
		}

		cb && cb.call(this, false);
	}

	startUserMedia(stream) {
		this.stream = stream;
		const input = window.audioContext.createMediaStreamSource(stream);
		this.recorder = new window.Recorder(input, {
			workerPath: 'mp3-realtime-worker.js',
			numChannels: 1,
		});
		return this.recorder.record();
	}

	stop(cb) {
		this.recorder.stop();

		cb && this.recorder.exportMP3(cb);

		this.stream.getAudioTracks()[0].stop();

		window.audioContext.close();

		delete window.audioContext;
		delete this.recorder;
		delete this.stream;
	}
});
