import { TranscriptionError } from '../errors';
import type { TranscriptionFetch } from '../types';
import { createWhisperCppServerEngine } from './whisperCppServer';

const input = {
	buffer: Buffer.from('audio-bytes'),
	mimeType: 'audio/mpeg',
	fileName: 'voice.mp3',
	language: 'en',
};

describe('createWhisperCppServerEngine', () => {
	it('rejects an empty server URL', () => {
		expect(() => createWhisperCppServerEngine({ engine: 'whisper-cpp-server', url: '' })).toThrow(TranscriptionError);
	});

	it('posts multipart audio to /inference and returns the transcript', async () => {
		let requestUrl = '';
		let contentType = '';
		let requestBody = Buffer.alloc(0);
		const fetch: TranscriptionFetch = async (url, options) => {
			requestUrl = url;
			contentType = options.headers?.['Content-Type'] ?? '';
			requestBody = options.body ?? Buffer.alloc(0);
			return {
				ok: true,
				status: 200,
				json: async () => ({ text: '  hello world  ', language: 'en' }),
				text: async () => '',
			};
		};

		const engine = createWhisperCppServerEngine({ engine: 'whisper-cpp-server', url: 'http://whisper.local:8080/' });
		const result = await engine.transcribe(input, { fetch, timeoutMs: 5_000 });

		expect(result).toEqual({ text: 'hello world', language: 'en' });
		expect(requestUrl).toBe('http://whisper.local:8080/inference');

		// node-fetch v2 can only stream a Buffer body, so the multipart payload is encoded by hand.
		const boundary = /^multipart\/form-data; boundary=(.+)$/.exec(contentType)?.[1];
		expect(boundary).toBeTruthy();

		const encoded = requestBody.toString('latin1');
		expect(encoded).toContain(`Content-Disposition: form-data; name="response_format"\r\n\r\njson\r\n`);
		expect(encoded).toContain(`Content-Disposition: form-data; name="temperature"\r\n\r\n0\r\n`);
		expect(encoded).toContain(`Content-Disposition: form-data; name="language"\r\n\r\nen\r\n`);
		expect(encoded).toContain(
			`Content-Disposition: form-data; name="file"; filename="voice.mp3"\r\nContent-Type: audio/mpeg\r\n\r\naudio-bytes\r\n`,
		);
		expect(encoded.endsWith(`--${boundary}--\r\n`)).toBe(true);
	});

	it('maps non-2xx responses to engine-error', async () => {
		const fetch: TranscriptionFetch = async () => ({
			ok: false,
			status: 503,
			json: async () => ({}),
			text: async () => 'busy',
		});

		const engine = createWhisperCppServerEngine({ engine: 'whisper-cpp-server', url: 'http://whisper.local:8080' });
		await expect(engine.transcribe(input, { fetch, timeoutMs: 5_000 })).rejects.toMatchObject({
			code: 'engine-error',
			status: 503,
		});
	});

	it('maps aborted requests to timeout', async () => {
		const fetch: TranscriptionFetch = async (_url, options) =>
			new Promise((_resolve, reject) => {
				options.signal?.addEventListener('abort', () => reject(new Error('aborted')));
			});

		const engine = createWhisperCppServerEngine({ engine: 'whisper-cpp-server', url: 'http://whisper.local:8080' });
		await expect(engine.transcribe(input, { fetch, timeoutMs: 1 })).rejects.toMatchObject({ code: 'timeout' });
	});

	it('maps malformed JSON bodies to invalid-response', async () => {
		const fetch: TranscriptionFetch = async () => ({
			ok: true,
			status: 200,
			json: async () => {
				throw new Error('bad json');
			},
			text: async () => '',
		});

		const engine = createWhisperCppServerEngine({ engine: 'whisper-cpp-server', url: 'http://whisper.local:8080' });
		await expect(engine.transcribe(input, { fetch, timeoutMs: 5_000 })).rejects.toMatchObject({ code: 'invalid-response' });
	});

	it('maps network failures to engine-unreachable', async () => {
		const fetch: TranscriptionFetch = async () => {
			throw new Error('ECONNREFUSED');
		};

		const engine = createWhisperCppServerEngine({ engine: 'whisper-cpp-server', url: 'http://whisper.local:8080' });
		await expect(engine.transcribe(input, { fetch, timeoutMs: 5_000 })).rejects.toMatchObject({ code: 'engine-unreachable' });
	});
});
