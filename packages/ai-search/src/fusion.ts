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

// Deliberately does not apply to keyword candidates: an exact error code or ticket id must not be
// dropped for being semantically unremarkable.
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

// Fuses on rank only: the retrievers report cosine distance and full-text rank respectively, so their
// raw scores are not comparable and must never meet. `semanticWeight` is the 0-100 admin balance.
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

// Gives single-retriever results the same rank-based score as fusion, so every mode reaches the
// temporal stage comparably scored.
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

// Multiplicative and bounded by `1 + recencyWeight`, so freshness reorders near-ties but cannot
// overturn a real relevance gap. A missing or unparseable `ts` keeps the relevance score rather than
// being penalised.
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
