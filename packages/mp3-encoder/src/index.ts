import { Mp3Encoder } from './lame';

type Config = {
	numChannels?: number;
	sampleRate?: number;
	bitRate?: number;
};

let encoder: Mp3Encoder;
const maxSamples = 1152;
let samplesMono: Int16Array;
let dataBuffer: Int8Array[];

function convertBuffer(samples: Float32Array): Int16Array {
	const output = new Int16Array(samples.length);

	for (let i = 0; i < samples.length; i++) {
		const s = Math.max(-1, Math.min(1, samples[i]));
		output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
	}

	return output;
}

function init(config: Config): void {
	config = config || {};
	encoder = new Mp3Encoder(config.numChannels || 1, config.sampleRate || 44100, config.bitRate || 32);
	dataBuffer = [];
}

function encode(arrayBuffer: Float32Array): void {
	samplesMono = convertBuffer(arrayBuffer);
	for (let i = 0; i < samplesMono.length; i += maxSamples) {
		const left = samplesMono.subarray(i, i + maxSamples);
		const buffer = encoder.encodeBuffer(left);
		dataBuffer.push(new Int8Array(buffer));
	}
}

function finish(): void {
	const buffer = encoder.flush();
	dataBuffer.push(new Int8Array(buffer));
	self.postMessage({ command: 'end', buffer: dataBuffer });
	dataBuffer = [];
}

function onMessage(event: MessageEvent): void {
	switch (event.data.command) {
		case 'init':
			init(event.data.config);
			break;

		case 'encode':
			encode(event.data.buffer);
			break;

		case 'finish':
			finish();
			break;
	}
}

self.onmessage = onMessage;
