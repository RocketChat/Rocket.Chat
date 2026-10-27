import { Readable } from 'node:stream';

import { streamToBuffer } from './stream';

describe('streamToBuffer', () => {
	it('rejects when a readable closes before it ends', async () => {
		const stream = new Readable({
			read() {},
		});
		const result = streamToBuffer(stream);
		stream.destroy();

		await expect(result).rejects.toMatchObject({ code: 'ERR_STREAM_PREMATURE_CLOSE' });
	});

	it('collects chunks from a paused stream', async () => {
		const chunks = [Buffer.from('first'), Buffer.from(' second')];
		const stream = Readable.from(chunks);
		stream.pause();

		await expect(streamToBuffer(stream)).resolves.toEqual(Buffer.concat(chunks));
	});

	it('returns an empty buffer for an empty stream', async () => {
		await expect(streamToBuffer(Readable.from([]))).resolves.toEqual(Buffer.alloc(0));
	});

	it('rejects with the source error', async () => {
		const error = new Error('source failed');
		const stream = new Readable({
			read() {
				this.destroy(error);
			},
		});

		await expect(streamToBuffer(stream)).rejects.toBe(error);
	});
});
