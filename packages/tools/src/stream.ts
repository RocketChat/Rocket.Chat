import type { Readable } from 'stream';

export const streamToBuffer = (stream: Readable): Promise<Buffer> =>
	new Promise((resolve, reject) => {
		const chunks: Array<Buffer> = [];

		stream
			.on('data', (data) => chunks.push(data))
			.on('end', () => resolve(Buffer.concat(chunks)))
			.on('error', (error) => reject(error))
			// force stream to resume data flow in case it was explicitly paused before
			.resume();
	});
