import { INTELLIGENT_SEARCH_RRF_CONSTANT } from './constants';
import type {
	FusedIntelligentSearchCandidate,
	IntelligentSearchCandidate,
	IntelligentSearchCandidateSource,
	TemporalRerankOptions,
} from './types';

const clampPercent = (value: unknown): number => {
	const numeric = Number(value);
	if (!Number.isFinite(numeric)) {
		return 0;
	}

	return Math.min(100, Math.max(0, Math.floor(numeric)));
};

const getCandidateId = (candidate: IntelligentSearchCandidate): string => candidate.msgId || candidate._id;

/**
 * Drops semantic candidates whose similarity is below the configured guardrail. Keyword candidates are
 * never scored by the embedding model, so the guardrail deliberately does not apply to them: an exact
 * error code or ticket id must not be discarded because it is semantically unremarkable.
 */
export const filterSemanticCandidatesByMinimumSimilarity = (
	candidates: IntelligentSearchCandidate[],
	minimumSimilarityPercent: number,
): IntelligentSearchCandidate[] => {
	const minimumSimilarity = clampPercent(minimumSimilarityPercent);
	if (!minimumSimilarity) {
		return candidates;
	}

	const threshold = minimumSimilarity / 100;
	return candidates.filter((candidate) => candidate.semanticSimilarity === undefined || candidate.semanticSimilarity >= threshold);
};

/**
 * Weighted Reciprocal Rank Fusion.
 *
 * The two retrievers report scores on incompatible scales (the pipeline returns cosine *distance* for
 * semantic hits and a full-text rank for keyword hits), so fusion works on ranks only and the raw scores
 * never meet. `semanticWeight` is the admin-facing 0-100 balance: 0 is keyword-only, 100 semantic-only.
 */
export const fuseCandidatesWithWeightedRRF = (
	semanticCandidates: IntelligentSearchCandidate[],
	keywordCandidates: IntelligentSearchCandidate[],
	semanticWeight: number,
	limit: number,
	rrfConstant: number = INTELLIGENT_SEARCH_RRF_CONSTANT,
): FusedIntelligentSearchCandidate[] => {
	const normalizedSemanticWeight = clampPercent(semanticWeight) / 100;
	const normalizedKeywordWeight = 1 - normalizedSemanticWeight;

	const fused = new Map<string, FusedIntelligentSearchCandidate>();
	const addBranch = (candidates: IntelligentSearchCandidate[], branch: IntelligentSearchCandidateSource, branchWeight: number): void => {
		for (let index = 0; index < candidates.length; index++) {
			const candidate = candidates[index];
			const candidateId = getCandidateId(candidate);
			if (!candidateId) {
				continue;
			}

			const rank = index + 1;
			const contribution = branchWeight / (rrfConstant + rank);
			const existing = fused.get(candidateId);
			if (!existing) {
				fused.set(candidateId, {
					...candidate,
					rrfScore: contribution,
					...(branch === 'semantic' ? { semanticRank: rank } : { fulltextRank: rank }),
				});
				continue;
			}

			fused.set(candidateId, {
				// a candidate found by both retrievers keeps the semantic similarity for display
				...existing,
				...(branch === 'semantic' && {
					score: candidate.score ?? existing.score,
					semanticSimilarity: candidate.semanticSimilarity ?? existing.semanticSimilarity,
					semanticDistance: candidate.semanticDistance ?? existing.semanticDistance,
				}),
				ts: existing.ts || candidate.ts,
				rrfScore: existing.rrfScore + contribution,
				...(branch === 'semantic' ? { semanticRank: rank } : { fulltextRank: rank }),
			});
		}
	};

	addBranch(semanticCandidates, 'semantic', normalizedSemanticWeight);
	addBranch(keywordCandidates, 'keyword', normalizedKeywordWeight);

	return [...fused.values()]
		.sort((a, b) => {
			if (b.rrfScore !== a.rrfScore) {
				return b.rrfScore - a.rrfScore;
			}

			const semanticRankDelta = (a.semanticRank ?? Number.MAX_SAFE_INTEGER) - (b.semanticRank ?? Number.MAX_SAFE_INTEGER);
			if (semanticRankDelta !== 0) {
				return semanticRankDelta;
			}

			return (a.fulltextRank ?? Number.MAX_SAFE_INTEGER) - (b.fulltextRank ?? Number.MAX_SAFE_INTEGER);
		})
		.slice(0, limit);
};

/**
 * Turns an already relevance-ordered list into fused candidates so that every retrieval mode reaches the
 * temporal stage with a comparable rank-based score.
 */
export const toRankedCandidates = (
	candidates: IntelligentSearchCandidate[],
	rrfConstant: number = INTELLIGENT_SEARCH_RRF_CONSTANT,
): FusedIntelligentSearchCandidate[] =>
	candidates.map((candidate, index) => ({
		...candidate,
		rrfScore: 1 / (rrfConstant + index + 1),
		...(candidate.source === 'keyword' ? { fulltextRank: index + 1 } : { semanticRank: index + 1 }),
	}));

export const getRecencyDecay = (ageInDays: number, halfLifeDays: number): number => {
	if (!(halfLifeDays > 0) || !Number.isFinite(ageInDays)) {
		return 0;
	}

	return 2 ** (-Math.max(0, ageInDays) / halfLifeDays);
};

/**
 * Multiplicative temporal boost applied after relevance fusion. A candidate posted right now scores
 * `1 + recencyWeight` times its relevance, decaying by half every `halfLifeDays`. Candidates without a
 * usable timestamp are left untouched rather than penalised, so a missing `ts` can never demote a hit.
 */
export const applyTemporalRerank = (
	candidates: FusedIntelligentSearchCandidate[],
	{ recencyWeight, halfLifeDays, now = new Date() }: TemporalRerankOptions,
): FusedIntelligentSearchCandidate[] => {
	const normalizedRecencyWeight = clampPercent(recencyWeight) / 100;
	if (!normalizedRecencyWeight || !(halfLifeDays > 0)) {
		return candidates;
	}

	const nowMs = now.getTime();
	const millisecondsPerDay = 24 * 60 * 60 * 1000;

	return candidates
		.map((candidate, index) => {
			const timestamp = candidate.ts ? new Date(candidate.ts).getTime() : Number.NaN;
			if (Number.isNaN(timestamp)) {
				return { candidate, index, score: candidate.rrfScore };
			}

			const ageInDays = (nowMs - timestamp) / millisecondsPerDay;
			const decay = getRecencyDecay(ageInDays, halfLifeDays);

			return { candidate, index, score: candidate.rrfScore * (1 + normalizedRecencyWeight * decay) };
		})
		.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.index - b.index))
		.map(({ candidate }) => candidate);
};
