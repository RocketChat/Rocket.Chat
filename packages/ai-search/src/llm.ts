import type { AIServiceFetch, AIServiceLogger, OpenAICompatibleProviderConfig, SearchAnswerMessage, SearchAnswerResult } from './types';

export const buildSearchAnswerPrompt = (
	query: string,
	messages: SearchAnswerMessage[],
	options: {
		maxMessages: number;
		maxTextLength: number;
	},
): string =>
	[
		`User search query: ${query}`,
		'Search results:',
		...messages.slice(0, options.maxMessages).map((message, index) => {
			const metadata = [
				message.username && `from @${message.username}`,
				message.roomName && `in #${message.roomName}`,
				message.ts && `at ${message.ts}`,
				typeof message.score === 'number' && `score ${Math.round(message.score * 100)}%`,
			]
				.filter(Boolean)
				.join(', ');
			return `${index + 1}. ${metadata ? `[${metadata}] ` : ''}${message.text.slice(0, options.maxTextLength)}`;
		}),
		'Answer using only the search results above. If the results do not contain enough information, say that clearly.',
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
	const response = await fetch(`${provider.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
		method: 'POST',
		timeout: 20000,
		ignoreSsrfValidation: true,
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
		logger?.warn?.({ msg: 'Search answer LLM provider returned error', status: response.status, body });
		throw new Error('error-ai-provider-request-failed');
	}

	const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
	const answer = json.choices?.[0]?.message?.content?.trim();
	if (!answer) {
		throw new Error('error-ai-provider-empty-response');
	}

	return { answer, provider: { name: provider.name, model: provider.model } };
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
		const response = await fetch(`${provider.baseUrl.replace(/\/+$/, '')}/models`, {
			method: 'GET',
			timeout: 10000,
			ignoreSsrfValidation: true,
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${provider.apiKey}`,
			},
		});

		if (!response.ok) {
			logger?.warn?.({ msg: 'AI LLM model lookup failed', status: response.status });
			return fallback;
		}

		const json = (await response.json()) as { data?: { id?: string }[] };
		const data = (json.data || [])
			.map(({ id }) => id)
			.filter((id): id is string => Boolean(id))
			.sort((a, b) => a.localeCompare(b))
			.map((id) => ({ key: id, label: id }));

		if (selectedModel && !data.some(({ key }) => key === selectedModel)) {
			data.unshift({ key: selectedModel, label: selectedModel });
		}

		return data;
	} catch (error) {
		logger?.warn?.({ msg: 'AI LLM model lookup request failed', err: error });
		return fallback;
	}
};
