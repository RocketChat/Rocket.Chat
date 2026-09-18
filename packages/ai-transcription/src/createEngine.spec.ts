import { createEngine } from './createEngine';
import { TranscriptionError } from './errors';

describe('createEngine', () => {
	it('creates a whisper.cpp server engine', () => {
		const engine = createEngine({ engine: 'whisper-cpp-server', url: 'http://localhost:8080' });
		expect(engine.name).toBe('whisper-cpp-server');
	});

	it('creates an openai-compatible engine', () => {
		const engine = createEngine({
			engine: 'openai-compatible',
			baseUrl: 'https://api.openai.com/v1',
			apiKey: 'secret',
			model: 'whisper-1',
		});
		expect(engine.name).toBe('openai-compatible');
	});

	it('rejects unknown engines', () => {
		expect(() => createEngine({ engine: 'unknown' } as never)).toThrow(TranscriptionError);
	});
});
