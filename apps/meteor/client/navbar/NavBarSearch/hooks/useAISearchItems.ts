import {
	AI_SEARCH_PAGE_SIZE,
	AI_SEARCH_ROOM_LOOKUP_LIMIT,
	buildFilterSuggestions,
	buildUserFilterSuggestions,
	emptySearchFilters,
	getFilterSearchState,
	getRoomLookupText,
	mergeFilterSuggestions,
	type SearchFilters,
	type SearchFilterSuggestion,
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
};

export const useAISearchItems = (
	filterText: string,
	appliedSearchFilters: SearchFilters = emptySearchFilters(),
	aiSearchActive = false,
): { data: AISearchItems; isFetching: boolean } => {
	const { t } = useTranslation();
	const enabled = aiSearchActive;
	const { searchText, filters, activeFilter } = useMemo(
		() => getFilterSearchState(filterText, appliedSearchFilters, enabled),
		[appliedSearchFilters, enabled, filterText],
	);
	const debouncedSearchText = useDebouncedValue(searchText, 500);
	const userFilter = activeFilter?.key === 'from' ? activeFilter.value.replace(/^@/, '') : '';
	const debouncedUserFilter = useDebouncedValue(userFilter, 500);
	const roomLookupText = useMemo(() => getRoomLookupText(activeFilter, enabled), [activeFilter, enabled]);
	const roomLookupQuery = useMemo(() => (roomLookupText ? getRoomLookupQuery(roomLookupText) : emptySubscriptionQuery), [roomLookupText]);
	const roomFilterRooms = useUserSubscriptions(roomLookupQuery, roomLookupOptions);

	const aiSearch = useEndpoint('GET', '/v1/ai.search');
	const shouldSearch = Boolean(enabled && debouncedSearchText.trim());
	const { data: intelligent = [], isFetching: isIntelligentFetching } = useQuery({
		queryKey: ['sidebar/search/intelligent', debouncedSearchText, filters],
		enabled: shouldSearch,
		queryFn: async () => {
			const result = await aiSearch({
				query: debouncedSearchText,
				intelligentCount: AI_SEARCH_PAGE_SIZE,
				...(filters.roomNames.length && { roomNames: filters.roomNames.join(',') }),
				...(filters.fromUsernames.length && { fromUsernames: filters.fromUsernames.join(',') }),
				...(filters.startDate && { startDate: filters.startDate }),
				...(filters.endDate && { endDate: filters.endDate }),
			});

			return result.intelligent;
		},
		staleTime: 60_000,
	});

	const localSuggestions = useMemo(
		() => (enabled ? buildFilterSuggestions(filterText, activeFilter, roomFilterRooms, t) : []),
		[activeFilter, enabled, filterText, roomFilterRooms, t],
	);
	const usersAutocomplete = useEndpoint('GET', '/v1/users.autocomplete');
	const { data: users = [], isFetching: isUsersFetching } = useQuery({
		queryKey: ['sidebar/search/users-autocomplete', debouncedUserFilter],
		enabled: enabled && activeFilter?.key === 'from',
		queryFn: async () => (await usersAutocomplete(buildUsernameAutocompleteQuery(debouncedUserFilter))).items,
		staleTime: 60_000,
	});
	const filterSuggestions = useMemo(
		() =>
			activeFilter?.key === 'from'
				? mergeFilterSuggestions(
						buildUserFilterSuggestions(filterText, activeFilter, userFilter === debouncedUserFilter ? users : [], t),
						localSuggestions,
					)
				: localSuggestions,
		[activeFilter, debouncedUserFilter, filterText, localSuggestions, t, userFilter, users],
	);

	return {
		data: {
			intelligent: shouldSearch && searchText === debouncedSearchText ? intelligent : [],
			filterSuggestions,
			searchText,
		},
		isFetching: isIntelligentFetching || isUsersFetching,
	};
};
