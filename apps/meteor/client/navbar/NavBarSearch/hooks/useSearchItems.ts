import {
	AI_LICENSE_MODULE,
	AI_SEARCH_PAGE_SIZE,
	buildRoomSearchQuery,
	emptySearchFilters,
	type SearchFilters,
	type SearchFilterSuggestion,
} from '@rocket.chat/ai-search';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { UnifiedSearchIntelligentResult } from '@rocket.chat/rest-typings';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useEndpoint, useSetting, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
	buildFilterSuggestions,
	buildRooms,
	buildUserFilterSuggestions,
	buildUsernameAutocompleteQuery,
	emptySubscriptionQuery,
	getFilterSearchState,
	getRoomLookupQuery,
	getRoomLookupText,
	getSelectedRooms,
	mergeFilterSuggestions,
	normalizeSpotlightResults,
	resolveSearchFilters,
} from './searchItems';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { getConfig } from '../../../lib/utils/getConfig';

const LIMIT = parseInt(String(getConfig('Sidebar_Search_Spotlight_LIMIT', 20)));

const options = {
	sort: {
		lm: -1,
		name: 1,
	},
	limit: LIMIT,
} as const;

export type NavBarSearchItems = {
	rooms: SubscriptionWithRoom[];
	intelligent: UnifiedSearchIntelligentResult[];
	filterSuggestions: SearchFilterSuggestion[];
	searchText: string;
};

type NavBarSearchItemsResult = {
	data: NavBarSearchItems;
	isLoading: boolean;
	isFetching: boolean;
};

const useRoomSearchResults = ({
	name,
	debouncedName,
	debouncedMention,
	localRooms,
}: {
	name: string;
	debouncedName: string;
	debouncedMention: string | undefined;
	localRooms: SubscriptionWithRoom[];
}): {
	rooms: SubscriptionWithRoom[];
	isLoading: boolean;
	isFetching: boolean;
} => {
	const getSpotlight = useEndpoint('GET', '/v1/spotlight');
	const usernamesFromClient = useMemo(() => {
		const usernames: string[] = [];
		for (const { t, name } of localRooms) {
			if (t === 'd' && name) {
				usernames.push(name);
			}
		}
		return usernames;
	}, [localRooms]);
	const searchForChannels = debouncedMention === '#';
	const searchForDMs = debouncedMention === '@';

	const type = useMemo(() => {
		if (searchForChannels) {
			return { users: false, rooms: true, includeFederatedRooms: true };
		}
		if (searchForDMs) {
			return { users: true, rooms: false };
		}
		return { users: true, rooms: true, includeFederatedRooms: true };
	}, [searchForChannels, searchForDMs]);

	const {
		data: serverResults,
		isFetching,
		isPlaceholderData,
	} = useQuery({
		queryKey: ['sidebar/search/spotlight', debouncedName, debouncedMention, type],
		enabled: localRooms.length < LIMIT,
		queryFn: async () => {
			const spotlight = await getSpotlight({
				query: debouncedName,
				usernames: usernamesFromClient.join(','),
				type: JSON.stringify(type),
			});

			return normalizeSpotlightResults(spotlight);
		},
		staleTime: 60_000,
		placeholderData: (previousData) => previousData,
	});

	const rooms = useMemo(() => buildRooms({ name, localRooms, serverResults, limit: LIMIT }), [localRooms, name, serverResults]);

	return {
		rooms,
		isLoading: isFetching && (isPlaceholderData || serverResults === undefined),
		isFetching,
	};
};

const useIntelligentSearchResults = ({
	enabled,
	query,
	filters,
}: {
	enabled: boolean;
	query: string;
	filters: SearchFilters;
}): {
	intelligent: UnifiedSearchIntelligentResult[];
	isFetching: boolean;
} => {
	const unifiedSearch = useEndpoint('GET', '/v1/search.unified');
	const { data: intelligent = [], isFetching } = useQuery({
		queryKey: ['sidebar/search/intelligent', query, filters],
		enabled,
		queryFn: async () => {
			const result = await unifiedSearch({
				query,
				count: 0,
				includeSpotlight: false,
				intelligentCount: AI_SEARCH_PAGE_SIZE,
				includeMessages: false,
				includeIntelligent: true,
				...(filters.rid && { rid: filters.rid }),
				...(filters.rids.length && { rids: filters.rids.join(',') }),
				...(filters.roomNames.length && { roomNames: filters.roomNames.join(',') }),
				...(filters.fromUsername && { fromUsername: filters.fromUsername }),
				...(filters.fromUsernames.length && { fromUsernames: filters.fromUsernames.join(',') }),
				...(filters.startDate && { startDate: filters.startDate }),
				...(filters.endDate && { endDate: filters.endDate }),
			});

			return result.intelligent;
		},
		staleTime: 60_000,
	});

	return { intelligent: enabled ? intelligent : [], isFetching };
};

const useInlineFilterSuggestions = ({
	canUseInlineFilters,
	filterText,
	activeFilter,
	roomFilterRooms,
	debouncedUserFilter,
}: {
	canUseInlineFilters: boolean;
	filterText: string;
	activeFilter: ReturnType<typeof getFilterSearchState>['activeFilter'];
	roomFilterRooms: SubscriptionWithRoom[];
	debouncedUserFilter: string;
}): {
	filterSuggestions: SearchFilterSuggestion[];
	isFetching: boolean;
} => {
	const { t } = useTranslation();
	const usersAutocomplete = useEndpoint('GET', '/v1/users.autocomplete');
	const filterSuggestions = useMemo(
		() => (canUseInlineFilters ? buildFilterSuggestions(filterText, activeFilter, roomFilterRooms, t) : []),
		[activeFilter, canUseInlineFilters, filterText, roomFilterRooms, t],
	);

	const { data: users = [], isFetching } = useQuery({
		queryKey: ['sidebar/search/users-autocomplete', debouncedUserFilter],
		enabled: canUseInlineFilters && activeFilter?.key === 'from',
		queryFn: async () => (await usersAutocomplete(buildUsernameAutocompleteQuery(debouncedUserFilter))).items,
		staleTime: 60_000,
	});

	const nextFilterSuggestions = useMemo(
		() =>
			activeFilter?.key === 'from'
				? mergeFilterSuggestions(buildUserFilterSuggestions(filterText, activeFilter, users, t), filterSuggestions)
				: filterSuggestions,
		[activeFilter, filterSuggestions, filterText, users, t],
	);

	return { filterSuggestions: nextFilterSuggestions, isFetching };
};

export const useSearchItems = (
	filterText: string,
	appliedSearchFilters: SearchFilters = emptySearchFilters(),
	aiSearchActive = false,
): NavBarSearchItemsResult => {
	const aiSearchFeatureEnabled = useFeaturePreview('aiSearch');
	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);
	const { data: hasIntelligentSearchLicense = false } = useHasLicenseModule(AI_LICENSE_MODULE);
	const canUseAISearch = Boolean(hasIntelligentSearchLicense && aiSearchFeatureEnabled);
	const canUseInlineFilters = Boolean(canUseAISearch && aiSearchActive);
	const { searchText, filters, activeFilter } = useMemo(
		() => getFilterSearchState(filterText, appliedSearchFilters, canUseInlineFilters),
		[appliedSearchFilters, canUseInlineFilters, filterText],
	);
	const [, mention, name] = useMemo(() => searchText.match(/(@|#)?(.*)/i) || [], [searchText]);
	const debouncedSearchText = useDebouncedValue(searchText, 500);
	const [, debouncedMention, debouncedName] = useMemo(() => debouncedSearchText.match(/(@|#)?(.*)/i) || [], [debouncedSearchText]);
	const debouncedUserFilter = useDebouncedValue(activeFilter?.key === 'from' ? activeFilter.value.replace(/^@/, '') : '', 500);
	const roomLookupText = useMemo(
		() => getRoomLookupText(activeFilter, filters, canUseInlineFilters),
		[activeFilter, canUseInlineFilters, filters],
	);
	const query = useMemo(() => buildRoomSearchQuery(name, mention), [name, mention]);
	const roomLookupQuery = useMemo(() => (roomLookupText ? getRoomLookupQuery(roomLookupText) : emptySubscriptionQuery), [roomLookupText]);

	const localRooms = useUserSubscriptions(query, options);
	const roomFilterRooms = useUserSubscriptions(roomLookupQuery, options);
	const selectedRooms = useMemo(() => getSelectedRooms(filters.roomNames, roomFilterRooms), [filters.roomNames, roomFilterRooms]);
	const resolvedFilters = useMemo(() => resolveSearchFilters(filters, selectedRooms), [filters, selectedRooms]);

	const shouldSearchIntelligent = Boolean(
		aiSearchActive && debouncedName.trim() && !debouncedMention && canUseAISearch && intelligentSearchEnabled,
	);
	const {
		rooms,
		isLoading,
		isFetching: isSpotlightFetching,
	} = useRoomSearchResults({
		name,
		debouncedName,
		debouncedMention,
		localRooms,
	});
	const { intelligent, isFetching: isIntelligentFetching } = useIntelligentSearchResults({
		enabled: shouldSearchIntelligent,
		query: debouncedName,
		filters: resolvedFilters,
	});
	const { filterSuggestions, isFetching: isUsersFetching } = useInlineFilterSuggestions({
		canUseInlineFilters,
		filterText,
		activeFilter,
		roomFilterRooms,
		debouncedUserFilter,
	});

	return {
		data: {
			rooms,
			intelligent,
			filterSuggestions,
			searchText,
		},
		isLoading,
		isFetching: isSpotlightFetching || isIntelligentFetching || isUsersFetching,
	};
};
