import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PdfWorker } from './index';
import {
	bigConversationData,
	dataWithASingleMessageButAReallyLongMessage,
	dataWithMultipleMessagesAndABigMessage,
	dataWithASingleMessageAndAnImage,
	dataWithASingleSystemMessage,
	dataWith2ReallyBigMessages,
} from './worker.fixtures';

const streamToBuffer = async (stream: NodeJS.ReadableStream) => {
	const chunks: (string | Buffer)[] = [];
	for await (const chunk of stream) {
		chunks.push(chunk);
	}

	return Buffer.concat(chunks as Buffer[]);
};

const pdfWorker = new PdfWorker('chat-transcript');

it('should fail to instantiate if no mode is provided', () => {
	// @ts-expect-error - testing
	expect(() => new PdfWorker('')).toThrow();
});

it('should fail to instantiate if mode is invalid', () => {
	// @ts-expect-error - testing
	expect(() => new PdfWorker('invalid')).toThrow();
});

it('should properly instantiate', () => {
	const newWorker = new PdfWorker('chat-transcript');

	expect(newWorker).toBeInstanceOf(PdfWorker);
	expect(newWorker.mode).toBe('chat-transcript');
});

it('should generate a pdf transcript for a big bunch of messages', async () => {
	const stream = await pdfWorker.renderToStream({ data: bigConversationData });
	const buffer = await streamToBuffer(stream);

	expect(buffer).toBeTruthy();
}, 10000);

it('should generate a pdf transcript for a single message, but a really long message', async () => {
	const stream = await pdfWorker.renderToStream({ data: dataWithASingleMessageButAReallyLongMessage });
	const buffer = await streamToBuffer(stream);

	expect(buffer).toBeTruthy();
}, 10000);

it('should generate a pdf transcript of a single message with an image', async () => {
	const stream = await pdfWorker.renderToStream({ data: dataWithASingleMessageAndAnImage });
	const buffer = await streamToBuffer(stream);

	expect(buffer).toBeTruthy();

	const tempDir = await mkdtemp(join(tmpdir(), 'pdf-worker'));
	const tempFile = join(tempDir, 'test.pdf');
	// console.log(tempFile);
	await writeFile(tempFile, buffer);
}, 10000);

it('should generate a pdf transcript for multiple messages, one big message and 2 small messages', async () => {
	const stream = await pdfWorker.renderToStream({ data: dataWithMultipleMessagesAndABigMessage });
	const buffer = await streamToBuffer(stream);

	expect(buffer).toBeTruthy();
}, 10000);

it('should generate a pdf transcript for a single system message', async () => {
	const stream = await pdfWorker.renderToStream({ data: dataWithASingleSystemMessage });
	const buffer = await streamToBuffer(stream);

	expect(buffer).toBeTruthy();
});

it('should generate a pdf transcript for rooms with messages consisting of tons of markdown elements', async () => {
	const stream = await pdfWorker.renderToStream({ data: dataWith2ReallyBigMessages });
	const buffer = await streamToBuffer(stream);

	expect(buffer).toBeTruthy();
});

describe('isMimeTypeValid', () => {
	it('should return true if mimeType is valid', () => {
		expect(pdfWorker.isMimeTypeValid('image/png')).toBe(true);
	});

	it('should return false if mimeType is not valid', () => {
		expect(pdfWorker.isMimeTypeValid('image/svg')).toBe(false);
	});
});
