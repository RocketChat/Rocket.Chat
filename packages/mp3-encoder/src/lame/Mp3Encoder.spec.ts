import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';

import { Mp3Encoder } from './Mp3Encoder';
import { WavHeader } from './WavHeader';

let leftSampleBuffer: ArrayBufferLike;
let rightSampleBuffer: ArrayBufferLike;

beforeAll(async () => {
	const leftPath = join('testdata', 'Left44100.wav');
	const rightPath = join('testdata', 'Right44100.wav');

	leftSampleBuffer = new Uint8Array(await readFile(leftPath)).buffer;
	rightSampleBuffer = new Uint8Array(await readFile(rightPath)).buffer;
});

test('mono', async () => {
	const waveHeader = WavHeader.readHeader(new DataView(leftSampleBuffer));
	const samples = new Int16Array(leftSampleBuffer, waveHeader.dataOffset, waveHeader.dataLen / 2);

	const hash = createHash('sha1');
	hash.setEncoding('hex');

	let remainingSamples = samples.length;

	const encoder = new Mp3Encoder();
	const maxSamples = 1152;

	for (let i = 0; remainingSamples >= maxSamples; i += maxSamples) {
		const left = samples.subarray(i, i + maxSamples);
		const right = samples.subarray(i, i + maxSamples);

		const mp3buf = encoder.encodeBuffer(left, right);
		if (mp3buf.length > 0) {
			hash.write(Buffer.from(mp3buf));
		}
		remainingSamples -= maxSamples;
	}

	const mp3buf = encoder.flush();
	if (mp3buf.length > 0) {
		hash.write(Buffer.from(mp3buf));
	}

	hash.end();

	expect(hash.read()).toBe('ca9292fc5fea3ba4cb07c4a0ba60cf0c267b783b');
});

test('stereo', async () => {
	const leftWaveHeader = WavHeader.readHeader(new DataView(leftSampleBuffer));
	const rightWaveHeader = WavHeader.readHeader(new DataView(rightSampleBuffer));

	expect(leftWaveHeader.sampleRate).toBe(rightWaveHeader.sampleRate);

	const leftSamples = new Int16Array(leftSampleBuffer, leftWaveHeader.dataOffset, leftWaveHeader.dataLen / 2);
	const rightSamples = new Int16Array(rightSampleBuffer, rightWaveHeader.dataOffset, rightWaveHeader.dataLen / 2);

	expect(leftSamples.length).toBe(rightSamples.length);

	const hash = createHash('sha1');
	hash.setEncoding('hex');

	let remainingSamples = leftSamples.length;

	const encoder = new Mp3Encoder(2, leftWaveHeader.sampleRate, 128);
	const maxSamples = 1152;

	for (let i = 0; remainingSamples >= maxSamples; i += maxSamples) {
		const left = leftSamples.subarray(i, i + maxSamples);
		const right = rightSamples.subarray(i, i + maxSamples);

		const mp3buf = encoder.encodeBuffer(left, right);
		if (mp3buf.length > 0) {
			hash.write(Buffer.from(mp3buf));
		}
		remainingSamples -= maxSamples;
	}

	const mp3buf = encoder.flush();
	if (mp3buf.length > 0) {
		hash.write(Buffer.from(mp3buf));
	}

	hash.end();

	expect(hash.read()).toBe('ab6daeb1c563389cafacc0ec4ed963ee8ae8e8d7');
});

describe.each([
	{ channels: 1, sampleRate: 48000, kbps: 32 },
	{ channels: 1, sampleRate: 44100, kbps: 32 },
	{ channels: 2, sampleRate: 44100, kbps: 128 },
])('$channels channel(s) at $sampleRate Hz and $kbps kbps', ({ channels, sampleRate, kbps }) => {
	const encode = (samples: Int16Array, chunkSize: number) => {
		const encoder = new Mp3Encoder(channels, sampleRate, kbps);
		const chunks: Uint8Array[] = [];

		for (let i = 0; i < samples.length; i += chunkSize) {
			chunks.push(encoder.encodeBuffer(samples.subarray(i, i + chunkSize)));
		}
		chunks.push(encoder.flush());

		return Buffer.concat(chunks);
	};

	const startsWithFrameSync = (mp3: Buffer) => mp3.length > 1 && mp3[0] === 0xff && (mp3[1] & 0xe0) === 0xe0;

	it('encodes silence', () => {
		expect(startsWithFrameSync(encode(new Int16Array(sampleRate), 4096))).toBe(true);
	});

	it('encodes a tone', () => {
		const tone = Int16Array.from({ length: sampleRate }, (_, i) => Math.round(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 16000));
		expect(startsWithFrameSync(encode(tone, 4096))).toBe(true);
	});

	it('encodes buffers shorter than a frame', () => {
		const tone = Int16Array.from({ length: 2000 }, (_, i) => Math.round(Math.sin(i / 10) * 16000));
		expect(startsWithFrameSync(encode(tone, 5))).toBe(true);
	});

	it('encodes a single sample', () => {
		expect(startsWithFrameSync(encode(new Int16Array([1000]), 1))).toBe(true);
	});

	it('flushes without any input', () => {
		expect(() => encode(new Int16Array(0), 1)).not.toThrow();
	});
});
