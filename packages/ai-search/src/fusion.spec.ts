import { INTELLIGENT_SEARCH_RRF_CONSTANT } from './constants';
import {
	applyTemporalRerank,
	filterSemanticCandidatesByMinimumSimilarity,
	fuseCandidatesWithWeightedRRF,
	getRecencyDecay,
	toRankedCandidates,
} from './fusion';
import type { FusedIntelligentSearchCandidate, IntelligentSearchCandidate } from './types';

const candidate = (msgId: string, overrides: Partial<IntelligentSearchCandidate> = {}): IntelligentSearchCandidate => ({
	_id: msgId,
	msgId,
	rid: 'room',
	pipelineText: `${msgId} text`,
	...overrides,
});

const ids = (candidates: Pick<IntelligentSearchCandidate, 'msgId'>[]): (string | undefined)[] => candidates.map(({ msgId }) => msgId);

describe('AI Search fusion helpers', () => {
	describe('filterSemanticCandidatesByMinimumSimilarity', () => {
		it('keeps every candidate when the guardrail is disabled', () => {
			const candidates = [candidate('m1', { semanticSimilarity: 0.1 }), candidate('m2', { semanticSimilarity: 0.9 })];

			expect(filterSemanticCandidatesByMinimumSimilarity(candidates, 0)).toEqual(candidates);
			expect(filterSemanticCandidatesByMinimumSimilarity(candidates, Number.NaN)).toEqual(candidates);
		});

		it('drops candidates below the minimum similarity', () => {
			const candidates = [
				candidate('m1', { semanticSimilarity: 0.82 }),
				candidate('m2', { semanticSimilarity: 0.69 }),
				candidate('m3', { semanticSimilarity: 0.7 }),
			];

			expect(ids(filterSemanticCandidatesByMinimumSimilarity(candidates, 70))).toEqual(['m1', 'm3']);
		});

		it('keeps candidates that carry no semantic similarity, so keyword hits survive the guardrail', () => {
			const candidates = [candidate('m1'), candidate('m2', { semanticSimilarity: 0.1 })];

			expect(ids(filterSemanticCandidatesByMinimumSimilarity(candidates, 70))).toEqual(['m1']);
		});
	});

	describe('fuseCandidatesWithWeightedRRF', () => {
		const semantic = [candidate('s1'), candidate('s2'), candidate('shared')];
		const keyword = [candidate('shared'), candidate('k1'), candidate('k2')];

		it('fuses on rank only, so incompatible retriever score scales never meet', () => {
			const highDistanceSemantic = [candidate('s1', { score: 0.02, semanticSimilarity: 0.02 })];
			const highScoreKeyword = [candidate('k1', { score: 0.99 })];

			// the semantic branch wins purely because it outranks on its own list, not because 0.99 > 0.02
			expect(ids(fuseCandidatesWithWeightedRRF(highDistanceSemantic, highScoreKeyword, 90, 10))).toEqual(['s1', 'k1']);
		});

		it('rewards candidates returned by both retrievers', () => {
			const fused = fuseCandidatesWithWeightedRRF(semantic, keyword, 50, 10);

			expect(fused[0].msgId).toBe('shared');
			expect(fused[0].semanticRank).toBe(3);
			expect(fused[0].fulltextRank).toBe(1);
		});

		it('shifts the ordering as the balance moves towards semantic', () => {
			expect(ids(fuseCandidatesWithWeightedRRF(semantic, keyword, 10, 3))).toEqual(['shared', 'k1', 'k2']);
			// 'shared' still leads at 90: its keyword rank 1 tops up an otherwise last-place semantic rank 3
			expect(ids(fuseCandidatesWithWeightedRRF(semantic, keyword, 90, 3))).toEqual(['shared', 's1', 's2']);
		});

		it('applies the documented weighted RRF contribution', () => {
			const [top] = fuseCandidatesWithWeightedRRF([candidate('only')], [], 60, 1);
			const k = INTELLIGENT_SEARCH_RRF_CONSTANT;

			expect(top.rrfScore).toBeCloseTo(0.6 / (k + 1), 10);
		});

		it('degrades to the populated branch when the other retriever returns nothing', () => {
			expect(ids(fuseCandidatesWithWeightedRRF(semantic, [], 50, 10))).toEqual(['s1', 's2', 'shared']);
			expect(ids(fuseCandidatesWithWeightedRRF([], keyword, 50, 10))).toEqual(['shared', 'k1', 'k2']);
		});

		it('keeps the semantic similarity of a candidate found by both retrievers', () => {
			const [top] = fuseCandidatesWithWeightedRRF(
				[candidate('shared', { score: 0.83, semanticSimilarity: 0.83, semanticDistance: 0.17 })],
				[candidate('shared')],
				50,
				1,
			);

			expect(top.score).toBe(0.83);
			expect(top.semanticSimilarity).toBe(0.83);
		});

		it('clamps out-of-range weights and respects the limit', () => {
			expect(ids(fuseCandidatesWithWeightedRRF(semantic, keyword, 500, 2))).toEqual(['s1', 's2']);
			expect(ids(fuseCandidatesWithWeightedRRF(semantic, keyword, -20, 2))).toEqual(['shared', 'k1']);
		});

		it('ignores candidates without any usable identifier', () => {
			const unidentified = { _id: '', msgId: '', rid: 'room', pipelineText: '' };

			expect(fuseCandidatesWithWeightedRRF([unidentified], [], 50, 10)).toEqual([]);
		});
	});

	describe('toRankedCandidates', () => {
		it('gives single-retriever results the same rank-based score shape as fusion', () => {
			const ranked = toRankedCandidates([candidate('m1'), candidate('m2')]);

			expect(ranked[0].rrfScore).toBeCloseTo(1 / (INTELLIGENT_SEARCH_RRF_CONSTANT + 1), 10);
			expect(ranked[0].semanticRank).toBe(1);
			expect(ranked[1].semanticRank).toBe(2);
		});

		it('records the keyword rank for keyword-sourced candidates', () => {
			const [ranked] = toRankedCandidates([candidate('m1', { source: 'keyword' })]);

			expect(ranked.fulltextRank).toBe(1);
			expect(ranked.semanticRank).toBeUndefined();
		});
	});

	describe('getRecencyDecay', () => {
		it('halves the decay every half-life', () => {
			expect(getRecencyDecay(0, 30)).toBe(1);
			expect(getRecencyDecay(30, 30)).toBeCloseTo(0.5, 10);
			expect(getRecencyDecay(60, 30)).toBeCloseTo(0.25, 10);
		});

		it('treats future timestamps as brand new and rejects an unusable half-life', () => {
			expect(getRecencyDecay(-5, 30)).toBe(1);
			expect(getRecencyDecay(10, 0)).toBe(0);
			expect(getRecencyDecay(Number.NaN, 30)).toBe(0);
		});
	});

	describe('applyTemporalRerank', () => {
		const now = new Date('2026-09-11T12:00:00.000Z');
		const daysAgo = (days: number): string => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
		const ranked = (entries: [string, number, string][]): FusedIntelligentSearchCandidate[] =>
			entries.map(([msgId, rrfScore, ts]) => ({ ...candidate(msgId, { ts }), rrfScore }));

		it('is a no-op when the boost is disabled', () => {
			const candidates = ranked([
				['old', 0.02, daysAgo(400)],
				['new', 0.01, daysAgo(0)],
			]);

			expect(applyTemporalRerank(candidates, { recencyWeight: 0, halfLifeDays: 30, now })).toEqual(candidates);
		});

		it('promotes a fresher candidate over a slightly more relevant stale one', () => {
			const candidates = ranked([
				['stale', 0.016, daysAgo(365)],
				['fresh', 0.015, daysAgo(0)],
			]);

			expect(ids(applyTemporalRerank(candidates, { recencyWeight: 100, halfLifeDays: 30, now }))).toEqual(['fresh', 'stale']);
		});

		it('cannot overturn a large relevance gap', () => {
			const candidates = ranked([
				['relevant', 0.05, daysAgo(365)],
				['fresh', 0.015, daysAgo(0)],
			]);

			expect(ids(applyTemporalRerank(candidates, { recencyWeight: 100, halfLifeDays: 30, now }))).toEqual(['relevant', 'fresh']);
		});

		it('leaves candidates without a usable timestamp at their relevance score rather than penalising them', () => {
			const candidates: FusedIntelligentSearchCandidate[] = [
				{ ...candidate('no-ts'), rrfScore: 0.02 },
				{ ...candidate('bad-ts', { ts: 'not-a-date' }), rrfScore: 0.019 },
				{ ...candidate('fresh', { ts: daysAgo(0) }), rrfScore: 0.018 },
			];

			expect(ids(applyTemporalRerank(candidates, { recencyWeight: 50, halfLifeDays: 30, now }))).toEqual(['fresh', 'no-ts', 'bad-ts']);
		});

		it('keeps the incoming order for ties', () => {
			const candidates = ranked([
				['first', 0.02, daysAgo(10)],
				['second', 0.02, daysAgo(10)],
			]);

			expect(ids(applyTemporalRerank(candidates, { recencyWeight: 40, halfLifeDays: 30, now }))).toEqual(['first', 'second']);
		});

		it('ignores an unusable half-life instead of dropping the boost silently', () => {
			const candidates = ranked([
				['stale', 0.016, daysAgo(365)],
				['fresh', 0.015, daysAgo(0)],
			]);

			expect(ids(applyTemporalRerank(candidates, { recencyWeight: 100, halfLifeDays: 0, now }))).toEqual(['stale', 'fresh']);
		});
	});
});
