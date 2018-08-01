(function(window) {
	const WORKER_PATH = 'audio-worker.js';
	const Recorder = function(source, config={}) {
		const bufferLen = config.bufferLen || 4096;
		const bitRate = config.bitRate || RocketChat.settings.get('Message_Audio_bitRate');
		let recording = false;
		const worker = new Worker(WORKER_PATH);
		let currCallback;
		this.dataBuffer = [];
		const appendToBuffer = (mp3Buf)=> {
			this.dataBuffer.push(new Int8Array(mp3Buf));
		};

		this.context = source.context;
		this.node = (this.context.createScriptProcessor ||
			this.context.createJavaScriptNode).call(this.context,
			bufferLen, 1, 1);
		worker.postMessage({
			command: 'init',
			config: {
				sampleRate: this.context.sampleRate,
				bitRate
			}
		});

		this.node.onaudioprocess = function(e) {
			if (!recording) { return; }
			worker.postMessage({
				command: 'encode',
				buffer: e.inputBuffer.getChannelData(0)
			});
		};

		this.record = function() {
			recording = true;
		};

		this.pause = function() {
			recording = false;
		};

		this.stop = function(callback) {
			currCallback = callback || config.callback;
			recording = false;
			worker.postMessage({
				command: 'finish'
			});
		};

		worker.onmessage = (e)=> {
			switch (e.data.command) {
				case 'data':
					appendToBuffer(e.data.buffer);
					break;
				case 'finished':
					if (currCallback) { currCallback(new Blob(this.dataBuffer, {type: 'audio/mp3'})); }
					break;
				default:
					console.log(e);
			}
		};

		source.connect(this.node);
		this.node.connect(this.context.destination); //this should not be necessary
	};
	window.Recorder = Recorder;
}(window));
