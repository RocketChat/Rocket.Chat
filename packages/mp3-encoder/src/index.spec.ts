import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';

import { WavHeader } from './lame/WavHeader';

import './index';

declare const self: any;

const post = (data: unknown) => self.dispatchEvent(new MessageEvent('message', { data }));

const readSamples = async () => {
	const { buffer } = new Uint8Array(await readFile(join('testdata', 'Left44100.wav')));
	const header = WavHeader.readHeader(new DataView(buffer));
	const pcm = new Int16Array(buffer, header.dataOffset, header.dataLen / 2);
	return { samples: Float32Array.from(pcm, (s) => s / 0x8000), sampleRate: header.sampleRate };
};

const encodeThroughWorker = (samples: Float32Array, sampleRate: number, chunkSize: number) => {
	post({ command: 'init', config: { numChannels: 1, sampleRate, bitRate: 32 } });
	for (let i = 0; i < samples.length; i += chunkSize) {
		post({ command: 'encode', buffer: samples.subarray(i, i + chunkSize) });
	}
	post({ command: 'finish' });

	expect(self.postMessage).toHaveBeenCalledTimes(1);
	const [[message]] = self.postMessage.mock.calls;
	expect(message.command).toBe('end');

	const chunks: Int8Array[] = message.buffer;
	const mp3 = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
	chunks.reduce((offset, chunk) => {
		mp3.set(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.length), offset);
		return offset + chunk.length;
	}, 0);
	return mp3;
};

describe('web worker messages', () => {
	beforeEach(() => {
		self.postMessage = jest.fn();
	});

	it('encodes recorded audio into an MP3 stream posted on finish', async () => {
		const { samples, sampleRate } = await readSamples();

		const mp3 = encodeThroughWorker(samples, sampleRate, 4096);

		expect(mp3[0]).toBe(0xff);
		expect(mp3[1] & 0xe0).toBe(0xe0);

		const expectedBytes = ((samples.length / sampleRate) * 32000) / 8;
		expect(mp3.length).toBeGreaterThan(expectedBytes * 0.9);
		expect(mp3.length).toBeLessThan(expectedBytes * 1.1);

		expect(createHash('sha1').update(mp3).digest('hex')).toBe('ca8016e1934ffa074751e3c2baa761ce860f3758');
	});

	it('produces the same stream regardless of how the audio is chunked', async () => {
		const { samples, sampleRate } = await readSamples();

		const mp3 = encodeThroughWorker(samples, sampleRate, 4096);
		self.postMessage.mockClear();
		const rechunked = encodeThroughWorker(samples, sampleRate, 1000);

		expect(rechunked).toEqual(mp3);
	});

	it('starts a fresh stream after finish', async () => {
		const { samples, sampleRate } = await readSamples();
		const first = samples.subarray(0, sampleRate);

		const mp3 = encodeThroughWorker(first, sampleRate, 4096);
		self.postMessage.mockClear();
		const again = encodeThroughWorker(first, sampleRate, 4096);

		expect(again).toEqual(mp3);
	});
});
