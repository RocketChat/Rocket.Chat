import { createOpenAICompatibleEngine } from './engines/openaiCompatible';
import { createWhisperCppServerEngine } from './engines/whisperCppServer';
import { TranscriptionError } from './errors';
import type { TranscriptionEngine, TranscriptionEngineConfig } from './types';

export const createEngine = (config: TranscriptionEngineConfig): TranscriptionEngine => {
	switch (config.engine) {
		case 'whisper-cpp-server':
			return createWhisperCppServerEngine(config);
		case 'openai-compatible':
			return createOpenAICompatibleEngine(config);
		default:
			throw new TranscriptionError('not-configured', `Unknown transcription engine: ${String((config as { engine?: unknown }).engine)}`);
	}
};
