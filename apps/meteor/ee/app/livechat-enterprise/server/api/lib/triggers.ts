import { serverFetch as fetch, type ExtendedFetchOptions } from '@rocket.chat/server-fetch';

export async function callTriggerExternalService({
	url,
	timeout,
	fallbackMessage,
	body,
	headers,
}: {
	url: string;
	timeout: number;
	fallbackMessage: string;
	body: Record<string, any>;
	headers: Record<string, string>;
}) {
	try {
		const response = await fetch(url, {
			timeout: timeout || 1000,
			body,
			headers,
			method: 'POST',
			// SECURITY: Integrations can only be configured by users with enough privileges. It's ok to disable this check here.
			ignoreSsrfValidation: true,
		} as ExtendedFetchOptions);

		if (!response.ok || response.status !== 200) {
			const text = await response.text();
			throw new Error(text);
		}

		const data = await response.json();

		const { contents } = data;

		if (
			!Array.isArray(contents) ||
			!contents.length ||
			!contents.every(({ msg, order }) => typeof msg === 'string' && typeof order === 'number')
		) {
			throw new Error('External service response does not match expected format');
		}

		return {
			response: {
				statusCode: response.status,
				contents: data?.contents || [],
			},
		};
	} catch (error: any) {
		const isTimeout = error.message === 'The user aborted a request.';
		return {
			error: isTimeout ? 'error-timeout' : 'error-invalid-external-service-response',
			response: error.message,
			fallbackMessage,
		};
	}
}
