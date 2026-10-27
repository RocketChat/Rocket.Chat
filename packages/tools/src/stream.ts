import type { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';

export const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
	const chunks: Buffer[] = [];
	const onData = (chunk: Buffer): void => {
		chunks.push(chunk);
	};
	const completion = finished(stream, { cleanup: true });

	stream.on('data', onData).resume();

	try {
		await completion;
		return Buffer.concat(chunks);
	} finally {
		stream.off('data', onData);
	}
};
