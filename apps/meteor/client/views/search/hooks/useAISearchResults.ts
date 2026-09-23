import { AI_SEARCH_RESULTS_PAGE_SIZE, MAX_INTELLIGENT_SEARCH_RESULTS, parseSearchInput, toAISearchParams } from '@rocket.chat/ai-search';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { AISearchResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const useAISearchResults = (queryParam: string, enabled: boolean) => {
	const aiSearch = useEndpoint('GET', '/v1/ai.search');
	const [resultCount, setResultCount] = useState(AI_SEARCH_RESULTS_PAGE_SIZE);
	const { text, filters } = useMemo(() => parseSearchInput(queryParam), [queryParam]);
	const query = useDebouncedValue(text.trim(), 300);
	const searchParams = useMemo(() => toAISearchParams({ text: query, filters }), [filters, query]);

	useEffect(() => {
		setResultCount(AI_SEARCH_RESULTS_PAGE_SIZE);
	}, [queryParam]);

	const result = useQuery({
		queryKey: ['search/intelligent/page', searchParams, resultCount],
		queryFn: () =>
			aiSearch({
				...searchParams,
				intelligentCount: Math.min(resultCount + 1, MAX_INTELLIGENT_SEARCH_RESULTS),
			}),
		enabled: Boolean(query && enabled),
		placeholderData: (previousData, previousQuery) =>
			(previousQuery?.queryKey[1] as { query?: string } | undefined)?.query === query ? previousData : undefined,
	});

	const intelligent = useMemo<AISearchResult[]>(
		() => result.data?.intelligent.slice(0, resultCount) ?? [],
		[result.data?.intelligent, resultCount],
	);
	const hasMoreResults = Boolean(result.data && result.data.intelligent.length > resultCount);
	const loadMore = useCallback(() => {
		setResultCount((current) => Math.min(current + AI_SEARCH_RESULTS_PAGE_SIZE, MAX_INTELLIGENT_SEARCH_RESULTS));
	}, []);

	return {
		query,
		intelligent,
		meta: result.data?.meta,
		hasMoreResults,
		loadMore,
		isLoading: result.isLoading,
		isPlaceholderData: result.isPlaceholderData,
		error: result.error,
	};
};
