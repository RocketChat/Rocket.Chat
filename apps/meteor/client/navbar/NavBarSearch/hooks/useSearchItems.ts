import {
	AI_LICENSE_MODULE,
	buildAppliedFilterChips,
	buildRoomSearchQuery,
	emptySearchFilters,
	type SearchFilterChip,
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
	appliedFilters: SearchFilterChip[];
	searchText: string;
	filters: SearchFilters;
};

type NavBarSearchItemsResult = {
	data: NavBarSearchItems;
	isLoading: boolean;
	isFetching: boolean;
};

export const useSearchItems = (
	filterText: string,
	appliedSearchFilters: SearchFilters = emptySearchFilters(),
	aiSearchActive = false,
): NavBarSearchItemsResult => {
	const { t } = useTranslation();
	const unifiedSearch = useEndpoint('GET', '/v1/search.unified');
	const usersAutocomplete = useEndpoint('GET', '/v1/users.autocomplete');
	const aiSearchFeatureEnabled = useFeaturePreview('aiSearch');
	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);
	const { data: hasIntelligentSearchLicense = false } = useHasLicenseModule(AI_LICENSE_MODULE);
	const canUseAISearch = Boolean(hasIntelligentSearchLicense && aiSearchFeatureEnabled);
	const canUseInlineFilters = Boolean(canUseAISearch && aiSearchActive);
	const { searchText, filters, activeFilter } = useMemo(
		() => getFilterSearchState(filterText, appliedSearchFilters, canUseInlineFilters),
		[appliedSearchFilters, canUseInlineFilters, filterText],
	);
	const appliedFilters = useMemo(() => (canUseInlineFilters ? buildAppliedFilterChips(filters) : []), [canUseInlineFilters, filters]);
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
	const filterSuggestions = useMemo(
		() => (canUseInlineFilters ? buildFilterSuggestions(filterText, activeFilter, roomFilterRooms, t) : []),
		[activeFilter, canUseInlineFilters, filterText, roomFilterRooms, t],
	);

	const usernamesFromClient = localRooms.map(({ t, name }) => (t === 'd' ? name : null)).filter(Boolean) as string[];

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

	const getSpotlight = useEndpoint('GET', '/v1/spotlight');

	const {
		data: serverResults,
		isFetching: isSpotlightFetching,
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

	const shouldSearchIntelligent = Boolean(
		aiSearchActive && debouncedName.trim() && !debouncedMention && canUseAISearch && intelligentSearchEnabled,
	);
	const { data: intelligent = [], isFetching: isIntelligentFetching } = useQuery({
		queryKey: ['sidebar/search/intelligent', debouncedName, resolvedFilters],
		enabled: shouldSearchIntelligent,
		queryFn: async () => {
			const result = await unifiedSearch({
				query: debouncedName,
				count: 0,
				includeSpotlight: false,
				intelligentCount: 3,
				includeMessages: false,
				includeIntelligent: true,
				...(resolvedFilters.rid && { rid: resolvedFilters.rid }),
				...(resolvedFilters.rids.length && { rids: resolvedFilters.rids.join(',') }),
				...(resolvedFilters.roomNames.length && { roomNames: resolvedFilters.roomNames.join(',') }),
				...(resolvedFilters.fromUsername && { fromUsername: resolvedFilters.fromUsername }),
				...(resolvedFilters.fromUsernames.length && { fromUsernames: resolvedFilters.fromUsernames.join(',') }),
				...(resolvedFilters.startDate && { startDate: resolvedFilters.startDate }),
				...(resolvedFilters.endDate && { endDate: resolvedFilters.endDate }),
			});

			return result.intelligent;
		},
		staleTime: 60_000,
	});

	const { data: users = [], isFetching: isUsersFetching } = useQuery({
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

	const rooms = useMemo(() => {
		return buildRooms({ name, localRooms, serverResults, limit: LIMIT });
	}, [localRooms, name, serverResults]);

	const isLoading = isSpotlightFetching && (isPlaceholderData || serverResults === undefined);
	const isFetching = isSpotlightFetching || isIntelligentFetching || isUsersFetching;

	return {
		data: {
			rooms,
			intelligent: shouldSearchIntelligent ? intelligent : [],
			filterSuggestions: nextFilterSuggestions,
			appliedFilters,
			searchText,
			filters: resolvedFilters,
		},
		isLoading,
		isFetching,
	};
};
