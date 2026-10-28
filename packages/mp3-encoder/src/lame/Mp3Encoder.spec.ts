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

	const encoder = new Mp3Encoder();
	const maxSamples = 1152;

	for (let i = 0; i < samples.length; i += maxSamples) {
		const left = samples.subarray(i, i + maxSamples);
		const right = samples.subarray(i, i + maxSamples);

		const mp3buf = encoder.encodeBuffer(left, right);
		if (mp3buf.length > 0) {
			hash.write(Buffer.from(mp3buf));
		}
	}

	const mp3buf = encoder.flush();
	if (mp3buf.length > 0) {
		hash.write(Buffer.from(mp3buf));
	}

	hash.end();

	expect(hash.read()).toBe('faea675a21a17077fa314f0112459d4f8702598f');
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

	const encoder = new Mp3Encoder(2, leftWaveHeader.sampleRate, 128);
	const maxSamples = 1152;

	for (let i = 0; i < leftSamples.length; i += maxSamples) {
		const left = leftSamples.subarray(i, i + maxSamples);
		const right = rightSamples.subarray(i, i + maxSamples);

		const mp3buf = encoder.encodeBuffer(left, right);
		if (mp3buf.length > 0) {
			hash.write(Buffer.from(mp3buf));
		}
	}

	const mp3buf = encoder.flush();
	if (mp3buf.length > 0) {
		hash.write(Buffer.from(mp3buf));
	}

	hash.end();

	expect(hash.read()).toBe('239ee8846bd09d42ca200fa308a18a69da6ad8f6');
});

test('encodes the same stream regardless of how the samples are chunked', () => {
	const waveHeader = WavHeader.readHeader(new DataView(leftSampleBuffer));
	const samples = new Int16Array(leftSampleBuffer, waveHeader.dataOffset, waveHeader.dataLen / 2);

	const encodeInChunks = (chunkSize: number) => {
		const encoder = new Mp3Encoder();
		const hash = createHash('sha1');
		for (let i = 0; i < samples.length; i += chunkSize) {
			hash.update(encoder.encodeBuffer(samples.subarray(i, i + chunkSize)));
		}
		hash.update(encoder.flush());
		return hash.digest('hex');
	};

	const whole = encodeInChunks(samples.length);

	expect(encodeInChunks(1152)).toBe(whole);
	expect(encodeInChunks(1000)).toBe(whole);
	expect(encodeInChunks(4097)).toBe(whole);
});
