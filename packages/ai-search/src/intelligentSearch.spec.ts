import {
	buildIntelligentSearchPipelineFilters,
	getSemanticDistanceThreshold,
	normalizeIntelligentSearchCandidates,
	normalizeSimilarityPercent,
	searchIntelligentPipeline,
} from './intelligentSearch';
import type { AIServiceFetch } from './types';

describe('AI Search intelligent search helpers', () => {
	describe('normalizeSimilarityPercent', () => {
		it('normalizes invalid and out-of-range values', () => {
			expect(normalizeSimilarityPercent(undefined)).toBe(0);
			expect(normalizeSimilarityPercent('abc')).toBe(0);
			expect(normalizeSimilarityPercent(-10)).toBe(0);
			expect(normalizeSimilarityPercent(101)).toBe(100);
			expect(normalizeSimilarityPercent(72.9)).toBe(72);
		});
	});

	describe('getSemanticDistanceThreshold', () => {
		it('converts minimum similarity to pipeline distance threshold', () => {
			expect(getSemanticDistanceThreshold(89)).toBe(0.11);
			expect(getSemanticDistanceThreshold(0)).toBe(1);
			expect(getSemanticDistanceThreshold(100)).toBe(0);
		});
	});

	describe('normalizeIntelligentSearchCandidates', () => {
		it('normalizes supported pipeline response shapes and score formats', () => {
			const results = normalizeIntelligentSearchCandidates(
				{
					results: [
						{ metadata: { room_id: 'r1', msg_id: 'm1', text: 'metadata text', score: 0.11 } },
						{ external_identifier: 'r2:m2', content: 'content text', similarity: 0.49 },
						{ id: 'm3', rid: 'r3', document: 'document text', distance: 12 },
						{ metadata: { room_id: 'r4', msg_id: 'm4', score: null, similarity: '' }, text: 'no numeric score' },
						{ text: 'missing ids' },
					],
				},
				[],
				10,
			);

			expect(results).toEqual([
				{
					_id: 'm1',
					rid: 'r1',
					msgId: 'm1',
					pipelineText: 'metadata text',
					score: 0.89,
					semanticSimilarity: 0.89,
					semanticDistance: 0.11,
					source: 'semantic',
				},
				{
					_id: 'm2',
					rid: 'r2',
					msgId: 'm2',
					pipelineText: 'content text',
					score: 0.49,
					semanticSimilarity: 0.49,
					semanticDistance: 0.51,
					source: 'semantic',
				},
				{
					_id: 'm3',
					rid: 'r3',
					msgId: 'm3',
					pipelineText: 'document text',
					score: 0.88,
					semanticSimilarity: 0.88,
					semanticDistance: 0.12,
					source: 'semantic',
				},
				{ _id: 'm4', rid: 'r4', msgId: 'm4', pipelineText: 'no numeric score', source: 'semantic' },
			]);
		});

		it('filters by subscribed room ids only when a prefilter is provided', () => {
			const rawResults = [
				{ metadata: { room_id: 'allowed', msg_id: 'm1' }, text: 'allowed' },
				{ metadata: { room_id: 'blocked', msg_id: 'm2' }, text: 'blocked' },
			];

			expect(normalizeIntelligentSearchCandidates(rawResults, [], 10)).toHaveLength(2);
			expect(normalizeIntelligentSearchCandidates(rawResults, ['allowed'], 10)).toEqual([
				{ _id: 'm1', rid: 'allowed', msgId: 'm1', pipelineText: 'allowed', source: 'semantic' },
			]);
		});

		it('honors the requested candidate limit after filtering invalid results', () => {
			const results = normalizeIntelligentSearchCandidates(
				[{ text: 'invalid' }, { metadata: { room_id: 'r1', msg_id: 'm1' } }, { metadata: { room_id: 'r2', msg_id: 'm2' } }],
				[],
				1,
			);

			expect(results).toEqual([{ _id: 'm1', rid: 'r1', msgId: 'm1', pipelineText: '', source: 'semantic' }]);
		});

		it('optionally marks the semantic source for caller-provided source input', () => {
			expect(
				normalizeIntelligentSearchCandidates(
					{ results: [{ metadata: { room_id: 'r1', msg_id: 'm1' }, text: 'keyword match', score: 0.42 }] },
					['r1'],
					10,
					undefined,
					'keyword',
				),
			).toEqual([
				{
					_id: 'm1',
					rid: 'r1',
					msgId: 'm1',
					pipelineText: 'keyword match',
					source: 'keyword',
				},
			]);
		});
	});

	describe('keyword candidate scores', () => {
		it('never reports a full-text rank as a semantic similarity', () => {
			// 0.2803 is the stronger lexical hit; read as a distance it would display as the weaker one
			const [best, worst] = normalizeIntelligentSearchCandidates(
				{
					results: [
						{ metadata: { room_id: 'r1', msg_id: 'm1' }, score: 0.2803 },
						{ metadata: { room_id: 'r2', msg_id: 'm2' }, score: 0.0183 },
					],
				},
				[],
				10,
				undefined,
				'keyword',
			);

			expect(best).not.toHaveProperty('score');
			expect(best).not.toHaveProperty('semanticSimilarity');
			expect(best).not.toHaveProperty('semanticDistance');
			expect(worst).not.toHaveProperty('score');
			expect(best.source).toBe('keyword');
		});

		it('still reports semantic similarity for semantic candidates', () => {
			const [candidate] = normalizeIntelligentSearchCandidates(
				{ results: [{ metadata: { room_id: 'r1', msg_id: 'm1' }, score: 0.2 }] },
				[],
				10,
				undefined,
				'semantic',
			);

			expect(candidate.score).toBe(0.8);
			expect(candidate.semanticSimilarity).toBe(0.8);
		});
	});

	describe('candidate timestamps', () => {
		it('carries the pipeline timestamp through for the temporal rerank stage', () => {
			const [withMetadataTs, withResultTs, withoutTs] = normalizeIntelligentSearchCandidates(
				{
					results: [
						{ metadata: { room_id: 'r1', msg_id: 'm1', timestamp: '2026-01-05T12:00:00.000Z' } },
						{ metadata: { room_id: 'r2', msg_id: 'm2' }, timestamp: '2026-02-05T12:00:00.000Z' },
						{ metadata: { room_id: 'r3', msg_id: 'm3' } },
					],
				},
				[],
				10,
			);

			expect(withMetadataTs.ts).toBe('2026-01-05T12:00:00.000Z');
			expect(withResultTs.ts).toBe('2026-02-05T12:00:00.000Z');
			expect(withoutTs).not.toHaveProperty('ts');
		});
	});

	describe('buildIntelligentSearchPipelineFilters', () => {
		it('returns undefined when no subscribed room ids are available', () => {
			expect(buildIntelligentSearchPipelineFilters([], {})).toBe(undefined);
		});

		it('serializes room, user, and date filters for the pipeline', () => {
			const startDate = new Date('2026-01-01T00:00:00.000Z');
			const endDate = new Date('2026-01-31T23:59:59.000Z');

			expect(
				buildIntelligentSearchPipelineFilters(['r1', 'r2', 'r3'], {
					rids: ['r1', 'r2'],
					fromUsername: '@alice',
					fromUsernames: ['bob', 'alice'],
					startDate,
					endDate,
				}),
			).toEqual({
				room_id: { $in: ['r1', 'r2'] },
				username: { $in: ['bob', 'alice'] },
				timestamp: { $ge: startDate.toISOString(), $le: endDate.toISOString() },
			});
		});

		it('rejects explicit room filters that are not subscribed', () => {
			expect(buildIntelligentSearchPipelineFilters(['r1'], { rid: 'r2' })).toBe(undefined);
		});

		it('passes broad subscribed room filters to the pipeline', () => {
			const roomIds = Array.from({ length: 1001 }, (_, index) => `r${index}`);

			expect(buildIntelligentSearchPipelineFilters(roomIds, { fromUsername: 'alice' })).toEqual({
				room_id: { $in: roomIds },
				username: { $eq: 'alice' },
			});
		});

		it('intersects explicit room filters while preserving their order', () => {
			const roomIds = Array.from({ length: 10_000 }, (_, index) => `r${index}`);

			expect(buildIntelligentSearchPipelineFilters(roomIds, { rids: ['r9999', 'missing', 'r1'] })).toEqual({
				room_id: { $in: ['r9999', 'r1'] },
			});
		});
	});

	describe('searchIntelligentPipeline', () => {
		it('sends the expected bounded request to the pipeline', async () => {
			let requestUrl = '';
			let requestBody = '';
			const fetch: AIServiceFetch = async (url, options) => {
				requestUrl = url;
				requestBody = String(options.body);
				return {
					ok: true,
					status: 200,
					json: async () => ({ results: [] }),
					text: async () => '',
				};
			};

			const result = await searchIntelligentPipeline({
				query: 'fruit colors',
				config: {
					baseUrl: 'https://pipeline.example.com/',
					pipelineId: 'workspace pipeline',
					apiKey: 'key',
					apiKeySecret: 'secret',
					queryTemplate: 'semantic: {query}',
					minimumSimilarityPercent: 61,
				},
				classifications: ['user', 'admin'],
				pipelineFilters: { room_id: { $eq: 'r1' } },
				limit: 8,
				fetch,
			});

			expect(result).toEqual({ results: [] });
			expect(requestUrl).toBe('https://pipeline.example.com/pipelines/workspace%20pipeline/search');
			expect(JSON.parse(requestBody)).toEqual({
				query: 'semantic: fruit colors',
				type: 'similarity',
				classification: {
					classifications: ['user', 'admin'],
					search_type: 2,
				},
				filters: { room_id: { $eq: 'r1' } },
				params: {
					k: 8,
					threshold: 0.39,
				},
			});
		});

		it('requests keyword mode and omits threshold when semantic filtering is not applicable', async () => {
			let requestBody = '';
			const fetch: AIServiceFetch = async (_url, options) => {
				requestBody = String(options.body);

				return {
					ok: true,
					status: 200,
					json: async () => ({ results: [] }),
					text: async () => '',
				};
			};

			await searchIntelligentPipeline({
				query: 'service health',
				config: {
					baseUrl: 'https://pipeline.example.com/',
					pipelineId: 'workspace',
					apiKey: 'key',
					apiKeySecret: 'secret',
					minimumSimilarityPercent: 70,
				},
				classifications: ['user'],
				pipelineFilters: { room_id: { $in: ['r1'] } },
				limit: 5,
				fetch,
				mode: 'keyword',
			});

			expect(JSON.parse(requestBody)).toEqual({
				query: 'service health',
				type: 'search',
				classification: {
					classifications: ['user'],
					search_type: 1,
				},
				filters: { room_id: { $in: ['r1'] } },
				params: {
					k: 5,
				},
			});
		});

		it('returns an empty result set for non-2xx pipeline responses', async () => {
			const fetch: AIServiceFetch = async () => ({
				ok: false,
				status: 500,
				json: async () => ({}),
				text: async () => 'failed',
			});

			const result = await searchIntelligentPipeline({
				query: 'fruit colors',
				config: {
					baseUrl: 'https://pipeline.example.com',
					pipelineId: 'workspace',
					apiKey: 'key',
					apiKeySecret: 'secret',
				},
				classifications: ['user'],
				pipelineFilters: {},
				limit: 5,
				fetch,
			});

			expect(result).toEqual([]);
		});
	});
});
