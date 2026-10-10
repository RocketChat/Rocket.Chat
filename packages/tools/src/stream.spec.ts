import { Readable } from 'node:stream';

import { streamToBuffer } from './stream';

describe('streamToBuffer', () => {
	it('rejects when a stream closes before ending', async () => {
		const stream = new Readable({
			read() {
				// Keep the source open until it is interrupted below.
			},
		});
		const result = streamToBuffer(stream);
		stream.destroy();
		await expect(result).rejects.toMatchObject({ code: 'ERR_STREAM_PREMATURE_CLOSE' });
	}, 1000);

	it('collects a paused binary stream', async () => {
		const stream = Readable.from([Buffer.from('first'), Buffer.from('second')]);
		stream.pause();
		await expect(streamToBuffer(stream)).resolves.toEqual(Buffer.from('firstsecond'));
	});

	it('returns an empty buffer for an empty stream', async () => {
		await expect(streamToBuffer(Readable.from([]))).resolves.toEqual(Buffer.alloc(0));
	});

	it('preserves a stream error', async () => {
		const error = new Error('download failed');
		const stream = new Readable({
			read() {
				this.destroy(error);
			},
		});
		await expect(streamToBuffer(stream)).rejects.toBe(error);
	});
});
