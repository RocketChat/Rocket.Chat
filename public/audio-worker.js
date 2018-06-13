/* globals importScripts, lamejs */

(function() {
	'use strict';
	importScripts('lame.min.js');
	let mp3Encoder;
	const maxSamples = 1152;
	let samplesMono;

	function appendToBuffer(mp3Buf) {
		self.postMessage({
			command: 'data',
			buffer: mp3Buf
		});
	}

	function init(config) {
		mp3Encoder = new lamejs.Mp3Encoder(1, config.sampleRate, config.bitRate);
	}

	function floatTo16BitPCM(input, output) {
		for (let i = 0; i < input.length; i++) {
			const s = Math.max(-1, Math.min(1, input[i]));
			output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
		}
	}

	function convertBuffer(arrayBuffer) {
		const data = new Float32Array(arrayBuffer);
		const out = new Int16Array(arrayBuffer.length);
		floatTo16BitPCM(data, out);
		return out;
	}

	function encode(arrayBuffer) {
		samplesMono = convertBuffer(arrayBuffer);
		let remaining = samplesMono.length;
		for (let i = 0; remaining >= 0; i += maxSamples) {
			const left = samplesMono.subarray(i, i + maxSamples);
			const mp3buf = mp3Encoder.encodeBuffer(left);
			appendToBuffer(mp3buf);
			remaining -= maxSamples;
		}
	}

	function finish() {
		appendToBuffer(mp3Encoder.flush());
		self.postMessage({
			command: 'finished'
		});
	}

	self.onmessage = function(e) {
		switch (e.data.command) {
			case 'init':
				init(e.data.config);
				break;
			case 'encode':
				encode(e.data.buffer);
				break;
			case 'finish':
				finish();
				break;
		}
	};

}());
