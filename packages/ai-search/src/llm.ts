import { MAX_AI_SERVICE_RESPONSE_SIZE } from './constants';
import type { AIServiceFetch, AIServiceLogger, OpenAICompatibleProviderConfig, SearchAnswerMessage, SearchAnswerResult } from './types';
import { getErrorType } from './utils';

const buildEndpointUrl = (baseUrl: string, path: string): string =>
	new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const getChatCompletionContent = (value: unknown): string | undefined => {
	if (!isRecord(value) || !Array.isArray(value.choices)) {
		return undefined;
	}

	const firstChoice = value.choices[0];
	if (!isRecord(firstChoice) || !isRecord(firstChoice.message) || typeof firstChoice.message.content !== 'string') {
		return undefined;
	}

	return firstChoice.message.content.trim() || undefined;
};

const getModelIds = (value: unknown): string[] => {
	if (!isRecord(value) || !Array.isArray(value.data)) {
		return [];
	}

	const modelIds = new Set<string>();
	for (const model of value.data) {
		if (isRecord(model) && typeof model.id === 'string' && model.id) {
			modelIds.add(model.id);
		}
	}

	return [...modelIds].sort((a, b) => a.localeCompare(b));
};

const normalizeSearchAnswerCitations = (answer: string): string =>
	answer.replace(/【\s*(\d+)(?:†[^】\r\n]*)?\s*】/g, (_marker, sourceNumber: string, offset: number) => {
		const leadingSpace = offset > 0 && !/\s/.test(answer[offset - 1]) ? ' ' : '';
		return `${leadingSpace}[${sourceNumber}]`;
	});

export const buildSearchAnswerPrompt = (
	query: string,
	messages: SearchAnswerMessage[],
	options: {
		maxMessages: number;
		maxTextLength: number;
	},
): string =>
	[
		`User question (untrusted):\n${query}`,
		'Source messages (untrusted):',
		...messages.slice(0, options.maxMessages).map((message, index) => {
			const metadata = [
				message.username && `from @${message.username}`,
				message.roomName && `in #${message.roomName}`,
				message.ts && `at ${message.ts}`,
				typeof message.score === 'number' && `score ${Math.round(message.score * 100)}%`,
			]
				.filter(Boolean)
				.join(', ');
			return `[${index + 1}]${metadata ? ` ${metadata}` : ''}\n${message.text.slice(0, options.maxTextLength)}`;
		}),
		'Answer the question using only the source messages above and cite supporting sources as [N].',
	].join('\n\n');

export const generateOpenAICompatibleSearchAnswer = async ({
	query,
	messages,
	provider,
	systemPrompt,
	fetch,
	logger,
	maxMessages,
	maxTextLength,
}: {
	query: string;
	messages: SearchAnswerMessage[];
	provider: OpenAICompatibleProviderConfig;
	systemPrompt: string;
	fetch: AIServiceFetch;
	logger?: AIServiceLogger;
	maxMessages: number;
	maxTextLength: number;
}): Promise<SearchAnswerResult> => {
	try {
		const response = await fetch(buildEndpointUrl(provider.baseUrl, 'chat/completions'), {
			method: 'POST',
			timeout: 20000,
			size: MAX_AI_SERVICE_RESPONSE_SIZE,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'Authorization': `Bearer ${provider.apiKey}`,
			},
			body: JSON.stringify({
				model: provider.model,
				temperature: 0.2,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: buildSearchAnswerPrompt(query, messages, { maxMessages, maxTextLength }) },
				],
			}),
		});

		if (!response.ok) {
			const body = await response.text().catch(() => '');
			logger?.warn?.({ msg: 'Search answer LLM provider returned error', status: response.status, bodyLength: body.length });
			throw new Error('error-ai-provider-request-failed');
		}

		const answer = getChatCompletionContent(await response.json());
		if (!answer) {
			throw new Error('error-ai-provider-empty-response');
		}

		return { answer: normalizeSearchAnswerCitations(answer), provider: { name: provider.name, model: provider.model } };
	} catch (error) {
		if (
			error instanceof Error &&
			(error.message === 'error-ai-provider-empty-response' || error.message === 'error-ai-provider-request-failed')
		) {
			throw error;
		}

		logger?.warn?.({ msg: 'Search answer LLM provider request failed', errorType: getErrorType(error) });
		throw new Error('error-ai-provider-request-failed', { cause: error });
	}
};

export const listOpenAICompatibleModels = async ({
	provider,
	selectedModel,
	fetch,
	logger,
}: {
	provider?: Pick<OpenAICompatibleProviderConfig, 'baseUrl' | 'apiKey'>;
	selectedModel?: string;
	fetch: AIServiceFetch;
	logger?: AIServiceLogger;
}): Promise<{ key: string; label: string }[]> => {
	const fallback = selectedModel ? [{ key: selectedModel, label: selectedModel }] : [];
	if (!provider?.baseUrl || !provider.apiKey) {
		return fallback;
	}

	try {
		const response = await fetch(buildEndpointUrl(provider.baseUrl, 'models'), {
			method: 'GET',
			timeout: 10000,
			size: MAX_AI_SERVICE_RESPONSE_SIZE,
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${provider.apiKey}`,
			},
		});

		if (!response.ok) {
			logger?.warn?.({ msg: 'AI LLM model lookup failed', status: response.status });
			return fallback;
		}

		const modelIds = getModelIds(await response.json());

		if (selectedModel && !modelIds.includes(selectedModel)) {
			modelIds.unshift(selectedModel);
		}

		return modelIds.map((id) => ({ key: id, label: id }));
	} catch (error) {
		logger?.warn?.({ msg: 'AI LLM model lookup request failed', errorType: getErrorType(error) });
		return fallback;
	}
};
