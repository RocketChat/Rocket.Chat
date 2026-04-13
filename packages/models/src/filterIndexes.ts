import type { IndexDescription } from 'mongodb';

/**
 * Operators that DocumentDB does not support inside `partialFilterExpression`.
 * DocumentDB only allows simple comparison operators ($eq, $gt, $gte, $lt, $lte)
 * in partial filter expressions. Indexes using $exists, $type, $regex, $or, etc.
 * fail with "Bad query specified" at index creation time.
 *
 * @see https://docs.aws.amazon.com/documentdb/latest/developerguide/functional-differences.html
 */
const UNSUPPORTED_PARTIAL_FILTER_OPERATORS = ['$exists', '$type', '$regex', '$or', '$and', '$not', '$nor', '$in', '$nin'];

const containsUnsupportedOperator = (expr: unknown): boolean => {
	if (!expr || typeof expr !== 'object') {
		return false;
	}

	for (const [key, value] of Object.entries(expr)) {
		if (UNSUPPORTED_PARTIAL_FILTER_OPERATORS.includes(key)) {
			return true;
		}
		if (typeof value === 'object' && value !== null && containsUnsupportedOperator(value)) {
			return true;
		}
	}
	return false;
};

const isTextIndex = (index: IndexDescription): boolean => {
	const key = index.key as Record<string, unknown> | undefined;
	if (!key) return false;
	return Object.values(key).some((v) => v === 'text');
};

const isUnsupportedPartialIndex = (index: IndexDescription): boolean => {
	if (!index.partialFilterExpression) return false;
	return containsUnsupportedOperator(index.partialFilterExpression);
};

/**
 * Filters out indexes that DocumentDB cannot create.
 *
 * When `DOCUMENTDB=true`, removes:
 *   - Text indexes (`{ field: 'text' }`) — DocumentDB has no native text search
 *   - Partial indexes with operators outside the supported subset
 *     (`$exists`, `$type`, `$regex`, etc.)
 *
 * Trade-off: the affected queries fall back to collection scans on DocumentDB,
 * which may be slower. Functionality is preserved.
 */
export function filterIndexesForDocumentDB(indexes: IndexDescription[], collectionName: string): IndexDescription[] {
	if (process.env.DOCUMENTDB !== 'true') {
		return indexes;
	}

	const skipped: string[] = [];
	const filtered = indexes.filter((index) => {
		if (isTextIndex(index)) {
			skipped.push(`text index on ${JSON.stringify(index.key)}`);
			return false;
		}
		if (isUnsupportedPartialIndex(index)) {
			skipped.push(`partial index on ${JSON.stringify(index.key)} (unsupported operator in partialFilterExpression)`);
			return false;
		}
		return true;
	});

	if (skipped.length) {
		console.warn(`[DocumentDB] Skipping ${skipped.length} unsupported index(es) on '${collectionName}':\n\t${skipped.join('\n\t')}`);
	}

	return filtered;
}
