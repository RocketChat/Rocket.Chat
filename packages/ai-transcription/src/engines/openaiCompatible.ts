import { TranscriptionError } from '../errors';
import type { OpenAICompatibleEngineConfig, TranscriptionEngine } from '../types';
import type { MultipartField } from './request';
import { buildEndpointUrl, createAudioMultipart, parseTranscriptionResult, postAudioMultipart } from './request';

export const OPENAI_COMPATIBLE_ENGINE_NAME = 'openai-compatible';

export const createOpenAICompatibleEngine = (config: OpenAICompatibleEngineConfig): TranscriptionEngine => {
	if (!config.baseUrl || !config.apiKey || !config.model) {
		throw new TranscriptionError('not-configured', 'OpenAI-compatible transcription provider is not configured');
	}

	return {
		name: OPENAI_COMPATIBLE_ENGINE_NAME,
		async transcribe(input, deps) {
			const fields: MultipartField[] = [
				['model', config.model],
				['response_format', 'json'],
			];
			if (input.language) {
				fields.push(['language', input.language]);
			}

			const { body: requestBody, contentType } = createAudioMultipart(input, fields);
			const body = await postAudioMultipart({
				url: buildEndpointUrl(config.baseUrl, 'audio/transcriptions'),
				body: requestBody,
				contentType,
				headers: { Authorization: `Bearer ${config.apiKey}` },
				deps,
			});

			return parseTranscriptionResult(body, input.language);
		},
	};
};
