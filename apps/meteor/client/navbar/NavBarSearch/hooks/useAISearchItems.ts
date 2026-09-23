import type { AppliedFilter, DraftSearchFilter, SearchFilterSuggestion } from '@rocket.chat/ai-search';
import {
	AI_SEARCH_PAGE_SIZE,
	AI_SEARCH_ROOM_LOOKUP_LIMIT,
	buildFilterSuggestions,
	buildUserFilterSuggestions,
	mergeAppliedFilters,
	mergeFilterSuggestions,
	parseSearchInput,
	removeDraftFilter,
	toAISearchParams,
} from '@rocket.chat/ai-search';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { AISearchResult } from '@rocket.chat/rest-typings';
import { useEndpoint, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { buildUsernameAutocompleteQuery, emptySubscriptionQuery, getRoomLookupQuery } from './aiSearchAdapters';

const roomLookupOptions = {
	sort: { lm: -1, name: 1 },
	limit: AI_SEARCH_ROOM_LOOKUP_LIMIT,
} as const;

export type AISearchItems = {
	intelligent: AISearchResult[];
	filterSuggestions: SearchFilterSuggestion[];
	searchText: string;
	draft?: DraftSearchFilter;
};

export const useAISearchItems = (
	filterText: string,
	appliedFilters: AppliedFilter[] = [],
	aiSearchActive = false,
): { data: AISearchItems; isFetching: boolean } => {
	const { t } = useTranslation();
	const enabled = aiSearchActive;

	const parsed = useMemo(
		() => (enabled ? parseSearchInput(filterText, { keepDraft: true }) : { text: filterText, filters: [], draft: undefined }),
		[enabled, filterText],
	);
	const { draft } = parsed;
	// the half-typed token stays in the input but must not reach the search request
	const searchText = draft ? removeDraftFilter(parsed.text) : parsed.text;
	const filters = useMemo(() => mergeAppliedFilters(appliedFilters, parsed.filters), [appliedFilters, parsed.filters]);

	const debouncedSearchText = useDebouncedValue(searchText, 500);
	const userFilter = draft?.key === 'from' ? draft.value.replace(/^@/, '') : '';
	const debouncedUserFilter = useDebouncedValue(userFilter, 500);
	const isRoomDraft = draft?.key === 'in';
	const roomLookupText = isRoomDraft ? draft.value.replace(/^#/, '') : '';
	const roomLookupQuery = useMemo(
		() => (isRoomDraft ? getRoomLookupQuery(roomLookupText) : emptySubscriptionQuery),
		[isRoomDraft, roomLookupText],
	);
	const roomFilterRooms = useUserSubscriptions(roomLookupQuery, roomLookupOptions);

	const aiSearch = useEndpoint('GET', '/v1/ai.search');
	const shouldSearch = Boolean(enabled && debouncedSearchText.trim());
	const searchParams = useMemo(() => toAISearchParams({ text: debouncedSearchText, filters }), [debouncedSearchText, filters]);
	const { data: intelligent = [], isFetching: isIntelligentFetching } = useQuery({
		queryKey: ['sidebar/search/intelligent', searchParams],
		enabled: shouldSearch,
		queryFn: async () => {
			const result = await aiSearch({ ...searchParams, intelligentCount: AI_SEARCH_PAGE_SIZE });

			return result.intelligent;
		},
		staleTime: 60_000,
	});

	const localSuggestions = useMemo(
		() => (enabled ? buildFilterSuggestions(draft, roomFilterRooms, t) : []),
		[draft, enabled, roomFilterRooms, t],
	);
	const usersAutocomplete = useEndpoint('GET', '/v1/users.autocomplete');
	const { data: users = [], isFetching: isUsersFetching } = useQuery({
		queryKey: ['sidebar/search/users-autocomplete', debouncedUserFilter],
		enabled: enabled && draft?.key === 'from',
		queryFn: async () => (await usersAutocomplete(buildUsernameAutocompleteQuery(debouncedUserFilter))).items,
		staleTime: 60_000,
	});
	const filterSuggestions = useMemo(
		() =>
			draft?.key === 'from'
				? mergeFilterSuggestions(buildUserFilterSuggestions(draft, userFilter === debouncedUserFilter ? users : [], t), localSuggestions)
				: localSuggestions,
		[debouncedUserFilter, draft, localSuggestions, t, userFilter, users],
	);

	return {
		data: {
			intelligent: shouldSearch && searchText === debouncedSearchText ? intelligent : [],
			filterSuggestions,
			searchText,
			draft,
		},
		isFetching: isIntelligentFetching || isUsersFetching,
	};
};
