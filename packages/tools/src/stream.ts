import type { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';

export const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
	if (stream.destroyed && !stream.readableEnded) {
		throw stream.errored ?? Object.assign(new Error('Premature close'), { code: 'ERR_STREAM_PREMATURE_CLOSE' });
	}

	const chunks: Buffer[] = [];
	const onData = (chunk: Buffer): void => {
		chunks.push(chunk);
	};
	const completion = finished(stream, { readable: true, writable: false, cleanup: true });

	stream.on('data', onData).resume();

	try {
		await completion;
		return Buffer.concat(chunks);
	} finally {
		stream.off('data', onData);
	}
};
