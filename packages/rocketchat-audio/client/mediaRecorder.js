(function(window) {
	const RCMediaRecorder = function(config) {
		let stream;
		let recorder;
		let chunks;
		const mediaOptions = {};
		config = config || {};
		mediaOptions.tag = config.tag || 'audio';
		mediaOptions.type = config.type || 'audio/ogg';
		mediaOptions.ext = config.ext || '.ogg',
		mediaOptions.gUM = config.gUM || { audio: true };
		let global_cb;

		this.start = function() {
			chunks = [];
			global_cb = undefined;
			navigator.mediaDevices.getUserMedia(mediaOptions.gUM).then(_stream => {
				stream = _stream;
				recorder = new MediaRecorder(stream);
				recorder.ondataavailable = e => {
					chunks.push(e.data);
					if (recorder.state === 'inactive') {
						global_cb();
					}
				};
				recorder.start();
			}).catch(function(e) { console.log(e); });
		};

		this.end = function(cb) {
			global_cb = () => {
				const blob = new Blob(chunks, { type:mediaOptions.type });
				cb(blob);
			};
			recorder.stop();
		};
	};
	window.RCMediaRecorder = RCMediaRecorder;
}(window));
