import { buildSearchAnswerPrompt, generateOpenAICompatibleSearchAnswer, listOpenAICompatibleModels } from './llm';
import type { AIServiceFetch } from './types';

describe('AI Search LLM helpers', () => {
	describe('buildSearchAnswerPrompt', () => {
		it('limits messages and truncates source text deterministically', () => {
			const prompt = buildSearchAnswerPrompt(
				'What did we decide?',
				[
					{
						text: 'A'.repeat(12),
						username: 'alice',
						roomName: 'general',
						ts: '2026-01-01T00:00:00.000Z',
						score: 0.615,
					},
					{ text: 'second result', username: 'bob' },
					{ text: 'third result' },
				],
				{ maxMessages: 2, maxTextLength: 5 },
			);

			expect(prompt).toBe(
				[
					'User question (untrusted):\nWhat did we decide?',
					'Source messages (untrusted):',
					'[1] from @alice, in #general, at 2026-01-01T00:00:00.000Z, score 62%\nAAAAA',
					'[2] from @bob\nsecon',
					'Answer the question using only the source messages above and cite supporting sources as [N].',
				].join('\n\n'),
			);
		});
	});

	describe('generateOpenAICompatibleSearchAnswer', () => {
		it('calls chat completions and returns the selected answer with provider metadata', async () => {
			let requestUrl = '';
			let requestBody = '';
			const fetch: AIServiceFetch = async (url, options) => {
				requestUrl = url;
				requestBody = String(options.body);
				return {
					ok: true,
					status: 200,
					json: async () => ({ choices: [{ message: { content: '  Answer from sources.  ' } }] }),
					text: async () => '',
				};
			};

			const result = await generateOpenAICompatibleSearchAnswer({
				query: 'fruit colors',
				messages: [{ text: 'oranges are green', username: 'alice' }],
				provider: {
					name: 'OpenAI compatible',
					baseUrl: 'https://llm.example.com/',
					apiKey: 'secret',
					model: 'gpt-test',
				},
				systemPrompt: 'Use sources only.',
				fetch,
				maxMessages: 4,
				maxTextLength: 200,
			});

			expect(result).toEqual({ answer: 'Answer from sources.', provider: { name: 'OpenAI compatible', model: 'gpt-test' } });
			expect(requestUrl).toBe('https://llm.example.com/chat/completions');
			expect(JSON.parse(requestBody)).toMatchObject({
				model: 'gpt-test',
				temperature: 0.2,
			});
			expect(JSON.parse(requestBody).messages[0]).toEqual({ role: 'system', content: 'Use sources only.' });
		});

		it('normalizes provider-specific source markers to numbered citations', async () => {
			const fetch: AIServiceFetch = async () => ({
				ok: true,
				status: 200,
				json: async () => ({ choices: [{ message: { content: 'Supported by both sources.【1†L1-L2】【2†L4-L5】' } }] }),
				text: async () => '',
			});

			await expect(
				generateOpenAICompatibleSearchAnswer({
					query: 'What happened?',
					messages: [{ text: 'First source' }, { text: 'Second source' }],
					provider: { name: 'OpenAI compatible', baseUrl: 'https://llm.example.com', apiKey: 'secret', model: 'gpt-test' },
					systemPrompt: 'Use numbered citations.',
					fetch,
					maxMessages: 4,
					maxTextLength: 200,
				}),
			).resolves.toEqual({
				answer: 'Supported by both sources. [1] [2]',
				provider: { name: 'OpenAI compatible', model: 'gpt-test' },
			});
		});

		it('throws on provider failures and empty responses', async () => {
			const failedFetch: AIServiceFetch = async () => ({
				ok: false,
				status: 500,
				json: async () => ({}),
				text: async () => 'failed',
			});

			await expect(
				generateOpenAICompatibleSearchAnswer({
					query: 'fruit colors',
					messages: [{ text: 'oranges are green' }],
					provider: { name: 'OpenAI compatible', baseUrl: 'https://llm.example.com', apiKey: 'secret', model: 'gpt-test' },
					systemPrompt: 'Use sources only.',
					fetch: failedFetch,
					maxMessages: 4,
					maxTextLength: 200,
				}),
			).rejects.toThrow('error-ai-provider-request-failed');

			const emptyFetch: AIServiceFetch = async () => ({
				ok: true,
				status: 200,
				json: async () => ({ choices: [{ message: { content: '   ' } }] }),
				text: async () => '',
			});

			await expect(
				generateOpenAICompatibleSearchAnswer({
					query: 'fruit colors',
					messages: [{ text: 'oranges are green' }],
					provider: { name: 'OpenAI compatible', baseUrl: 'https://llm.example.com', apiKey: 'secret', model: 'gpt-test' },
					systemPrompt: 'Use sources only.',
					fetch: emptyFetch,
					maxMessages: 4,
					maxTextLength: 200,
				}),
			).rejects.toThrow('error-ai-provider-empty-response');
		});

		it('normalizes malformed provider JSON responses as request failures', async () => {
			const malformedFetch: AIServiceFetch = async () => ({
				ok: true,
				status: 200,
				json: async () => {
					throw new SyntaxError('Unexpected token');
				},
				text: async () => '',
			});

			await expect(
				generateOpenAICompatibleSearchAnswer({
					query: 'fruit colors',
					messages: [{ text: 'oranges are green' }],
					provider: { name: 'OpenAI compatible', baseUrl: 'https://llm.example.com', apiKey: 'secret', model: 'gpt-test' },
					systemPrompt: 'Use sources only.',
					fetch: malformedFetch,
					maxMessages: 4,
					maxTextLength: 200,
				}),
			).rejects.toThrow('error-ai-provider-request-failed');
		});

		it('rejects valid JSON with an invalid chat completion shape', async () => {
			const invalidResponseFetch: AIServiceFetch = async () => ({
				ok: true,
				status: 200,
				json: async () => ({ choices: [{ message: { content: 42 } }] }),
				text: async () => '',
			});

			await expect(
				generateOpenAICompatibleSearchAnswer({
					query: 'fruit colors',
					messages: [{ text: 'oranges are green' }],
					provider: { name: 'OpenAI compatible', baseUrl: 'https://llm.example.com', apiKey: 'secret', model: 'gpt-test' },
					systemPrompt: 'Use sources only.',
					fetch: invalidResponseFetch,
					maxMessages: 4,
					maxTextLength: 200,
				}),
			).rejects.toThrow('error-ai-provider-empty-response');
		});
	});

	describe('listOpenAICompatibleModels', () => {
		it('returns the configured model when provider lookup is not configured', async () => {
			const fetch: AIServiceFetch = async () => {
				throw new Error('must not fetch');
			};

			expect(await listOpenAICompatibleModels({ selectedModel: 'existing-model', fetch })).toEqual([
				{ key: 'existing-model', label: 'existing-model' },
			]);
		});

		it('sorts provider models and preserves the selected custom model', async () => {
			const fetch: AIServiceFetch = async () => ({
				ok: true,
				status: 200,
				json: async () => ({ data: [{ id: 'z-model' }, { id: 'a-model' }, { id: 'a-model' }, { id: 42 }, null] }),
				text: async () => '',
			});

			expect(
				await listOpenAICompatibleModels({
					provider: { baseUrl: 'https://llm.example.com', apiKey: 'secret' },
					selectedModel: 'custom-model',
					fetch,
				}),
			).toEqual([
				{ key: 'custom-model', label: 'custom-model' },
				{ key: 'a-model', label: 'a-model' },
				{ key: 'z-model', label: 'z-model' },
			]);
		});

		it('falls back to the selected model when provider lookup fails', async () => {
			const fetch: AIServiceFetch = async () => ({
				ok: false,
				status: 401,
				json: async () => ({}),
				text: async () => 'unauthorized',
			});

			expect(
				await listOpenAICompatibleModels({
					provider: { baseUrl: 'https://llm.example.com', apiKey: 'secret' },
					selectedModel: 'configured-model',
					fetch,
				}),
			).toEqual([{ key: 'configured-model', label: 'configured-model' }]);
		});
	});
});
