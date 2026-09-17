import { TranscriptionError } from '../errors';
import type { TranscriptionFetch } from '../types';
import { createOpenAICompatibleEngine } from './openaiCompatible';

const input = {
	buffer: Buffer.from('audio-bytes'),
	mimeType: 'audio/mpeg',
	fileName: 'voice.mp3',
};

describe('createOpenAICompatibleEngine', () => {
	it('rejects incomplete configuration', () => {
		expect(() =>
			createOpenAICompatibleEngine({
				engine: 'openai-compatible',
				baseUrl: '',
				apiKey: 'key',
				model: 'whisper-1',
			}),
		).toThrow(TranscriptionError);
	});

	it('posts multipart audio to /audio/transcriptions with bearer auth', async () => {
		let requestUrl = '';
		let authorization = '';
		let contentType = '';
		let requestBody = Buffer.alloc(0);
		const fetch: TranscriptionFetch = async (url, options) => {
			requestUrl = url;
			authorization = options.headers?.Authorization ?? '';
			contentType = options.headers?.['Content-Type'] ?? '';
			requestBody = options.body ?? Buffer.alloc(0);
			return {
				ok: true,
				status: 200,
				json: async () => ({ text: 'transcribed text' }),
				text: async () => '',
			};
		};

		const engine = createOpenAICompatibleEngine({
			engine: 'openai-compatible',
			baseUrl: 'https://api.openai.com/v1/',
			apiKey: 'secret',
			model: 'whisper-1',
		});
		const result = await engine.transcribe(input, { fetch, timeoutMs: 5_000 });

		expect(result).toEqual({ text: 'transcribed text' });
		expect(requestUrl).toBe('https://api.openai.com/v1/audio/transcriptions');
		expect(authorization).toBe('Bearer secret');
		expect(contentType).toMatch(/^multipart\/form-data; boundary=/);

		const encoded = requestBody.toString('latin1');
		expect(encoded).toContain(`Content-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n`);
		expect(encoded).toContain(`Content-Disposition: form-data; name="response_format"\r\n\r\njson\r\n`);
		expect(encoded).toContain(
			`Content-Disposition: form-data; name="file"; filename="voice.mp3"\r\nContent-Type: audio/mpeg\r\n\r\naudio-bytes\r\n`,
		);
	});

	it('maps non-2xx responses to engine-error', async () => {
		const fetch: TranscriptionFetch = async () => ({
			ok: false,
			status: 401,
			json: async () => ({}),
			text: async () => 'unauthorized',
		});

		const engine = createOpenAICompatibleEngine({
			engine: 'openai-compatible',
			baseUrl: 'https://api.openai.com/v1',
			apiKey: 'secret',
			model: 'whisper-1',
		});
		await expect(engine.transcribe(input, { fetch, timeoutMs: 5_000 })).rejects.toMatchObject({
			code: 'engine-error',
			status: 401,
		});
	});

	it('maps responses without text to invalid-response', async () => {
		const fetch: TranscriptionFetch = async () => ({
			ok: true,
			status: 200,
			json: async () => ({ language: 'en' }),
			text: async () => '',
		});

		const engine = createOpenAICompatibleEngine({
			engine: 'openai-compatible',
			baseUrl: 'https://api.openai.com/v1',
			apiKey: 'secret',
			model: 'whisper-1',
		});
		await expect(engine.transcribe(input, { fetch, timeoutMs: 5_000 })).rejects.toMatchObject({ code: 'invalid-response' });
	});
});
