export function queryFiltersStatus(query: unknown): boolean {
	if (Array.isArray(query)) {
		return query.some(queryFiltersStatus);
	}

	if (query === null || typeof query !== 'object') {
		return false;
	}

	return Object.entries(query).some(([key, value]) => key.startsWith('status') || queryFiltersStatus(value));
}
