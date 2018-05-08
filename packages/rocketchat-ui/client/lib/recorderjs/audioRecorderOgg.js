/* globals MediaRecorder */
this.AudioRecorderOgg = new class {
	start(cb) {
		self = this;
		window.URL = window.URL || window.webkitURL;

		if ((navigator.mediaDevices.getUserMedia == null)) {
			return cb(false);
		}

		return navigator.mediaDevices.getUserMedia({ audio: true })
			.then(function(stream) {
				self.stream = stream;
				self.chunks = [];
				self.recorder = new MediaRecorder(stream);
				self.recorder.ondataavailable = e => {
					self.chunks.push(e.data);
				};
				self.recorder.onstop = () => {
					if (self.cb != null) {
						self.cb(new Blob(self.chunks, { type: 'audio/ogg' }));
					}
					delete self.chunks;
				};
				self.recorder.start(1000);
				return (cb != null ? cb.call(self) : undefined);
			})
			.catch(function(e) {
				console.log(`No live audio input: ${ e }`);
			});
	}

	stop(cb) {
		self.cb = cb;
		self.recorder.stop();
		self.stream.getAudioTracks()[0].stop();
		delete self.recorder;
		return delete self.stream;
	}
};
