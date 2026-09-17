import { TranscriptionError } from '../errors';
import type { TranscriptionEngineDeps, TranscriptionInput, TranscriptionResult } from '../types';

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const buildEndpointUrl = (baseUrl: string, path: string): string => `${baseUrl.replace(/\/+$/, '')}/${path}`;

export type MultipartField = [name: string, value: string];

export type MultipartBody = {
	body: Buffer;
	contentType: string;
};

const CRLF = '\r\n';

const escapeQuotes = (value: string): string => value.replace(/"/g, '%22');

/**
 * Encodes the request by hand instead of using `FormData`: the service calls engines
 * through `@rocket.chat/server-fetch`, which runs on node-fetch v2 and cannot serialize
 * a WHATWG `FormData` — it would send `{}` as `application/json`.
 */
export const createAudioMultipart = ({ buffer, mimeType, fileName }: TranscriptionInput, fields: MultipartField[]): MultipartBody => {
	const boundary = `----RocketChatTranscription${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
	const parts: Buffer[] = [];

	for (const [name, value] of fields) {
		parts.push(
			Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="${escapeQuotes(name)}"${CRLF}${CRLF}${value}${CRLF}`),
		);
	}

	parts.push(
		Buffer.from(
			`--${boundary}${CRLF}Content-Disposition: form-data; name="file"; filename="${escapeQuotes(fileName)}"${CRLF}` +
				`Content-Type: ${mimeType}${CRLF}${CRLF}`,
		),
		buffer,
		Buffer.from(CRLF),
	);

	parts.push(Buffer.from(`--${boundary}--${CRLF}`));

	return { body: Buffer.concat(parts), contentType: `multipart/form-data; boundary=${boundary}` };
};

export const postAudioMultipart = async ({
	url,
	body: requestBody,
	contentType,
	headers,
	deps: { fetch, logger, timeoutMs },
}: {
	url: string;
	body: Buffer;
	contentType: string;
	headers?: Record<string, string>;
	deps: TranscriptionEngineDeps;
}): Promise<unknown> => {
	const controller = new AbortController();
	const timer = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

	try {
		let response;
		try {
			response = await fetch(url, {
				method: 'POST',
				headers: { ...headers, 'Content-Type': contentType },
				body: requestBody,
				signal: controller.signal,
			});
		} catch (error) {
			if (controller.signal.aborted) {
				throw new TranscriptionError('timeout', `Transcription engine did not respond within ${timeoutMs}ms`, { cause: error });
			}
			throw new TranscriptionError('engine-unreachable', 'Transcription engine is unreachable', { cause: error });
		}

		if (!response.ok) {
			const body = await response.text().catch(() => '');
			logger?.warn?.({ msg: 'Transcription engine returned an error', status: response.status, bodyLength: body.length });
			throw new TranscriptionError('engine-error', `Transcription engine responded with status ${response.status}`, {
				status: response.status,
			});
		}

		try {
			return await response.json();
		} catch (error) {
			throw new TranscriptionError('invalid-response', 'Transcription engine returned a malformed response body', { cause: error });
		}
	} finally {
		clearTimeout(timer);
	}
};

export const parseTranscriptionResult = (body: unknown, fallbackLanguage?: string): TranscriptionResult => {
	if (!isRecord(body) || typeof body.text !== 'string') {
		throw new TranscriptionError('invalid-response', 'Transcription engine response has no text');
	}

	const language = typeof body.language === 'string' && body.language ? body.language : fallbackLanguage;

	return language ? { text: body.text.trim(), language } : { text: body.text.trim() };
};
