import { TranscriptionError } from '../errors';
import type { TranscriptionEngine, WhisperCppServerEngineConfig } from '../types';
import type { MultipartField } from './request';
import { buildEndpointUrl, createAudioMultipart, parseTranscriptionResult, postAudioMultipart } from './request';

export const WHISPER_CPP_SERVER_ENGINE_NAME = 'whisper-cpp-server';

/**
 * whisper-server serializes inference requests on a mutex, so callers must cap concurrency.
 */
export const createWhisperCppServerEngine = (config: WhisperCppServerEngineConfig): TranscriptionEngine => {
	if (!config.url) {
		throw new TranscriptionError('not-configured', 'Whisper server URL is not configured');
	}

	return {
		name: WHISPER_CPP_SERVER_ENGINE_NAME,
		async transcribe(input, deps) {
			const fields: MultipartField[] = [
				['response_format', 'json'],
				['temperature', '0'],
			];
			if (input.language) {
				fields.push(['language', input.language]);
			}

			const { body: requestBody, contentType } = createAudioMultipart(input, fields);
			const body = await postAudioMultipart({
				url: buildEndpointUrl(config.url, 'inference'),
				body: requestBody,
				contentType,
				deps,
			});

			return parseTranscriptionResult(body, input.language);
		},
	};
};
