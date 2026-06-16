import {
	AI_LICENSE_MODULE,
	applySearchFilterToken,
	buildAppliedFilterChips,
	buildRoomSearchQuery,
	emptySearchFilters,
	getActiveSearchFilter,
	mergeSearchFilters,
	parseSearchFilterText,
	type ActiveSearchFilter,
	type SearchFilterChip,
	type SearchFilters,
	type SearchFilterSuggestion,
} from '@rocket.chat/ai-search';
import type { UnifiedSearchIntelligentResult } from '@rocket.chat/rest-typings';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useEndpoint, useSetting, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

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

const emptySubscriptionQuery = { _id: '__ai_search_no_room_filter__' };

export type NavBarSearchItems = {
	rooms: SubscriptionWithRoom[];
	intelligent: UnifiedSearchIntelligentResult[];
	filterSuggestions: SearchFilterSuggestion[];
	appliedFilters: SearchFilterChip[];
	searchText: string;
	filters: SearchFilters;
};

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

const getDateFilterSuggestions = (
	filterText: string,
	activeFilter: ActiveSearchFilter,
	key: 'after' | 'before',
): SearchFilterSuggestion[] => {
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);
	const lastWeek = new Date(today);
	lastWeek.setDate(today.getDate() - 7);

	return [
		{ label: 'Today', value: formatDate(today) },
		{ label: 'Yesterday', value: formatDate(yesterday) },
		{ label: 'Last 7 days', value: formatDate(lastWeek) },
	].map(({ label, value }) => ({
		key: `${key}-${value}`,
		group: 'dates',
		title: `${key}:${value}`,
		description: label,
		value: applySearchFilterToken(filterText, activeFilter, key, value),
		icon: 'calendar',
	}));
};

const buildFilterSuggestions = (
	filterText: string,
	activeFilter: ActiveSearchFilter | undefined,
	rooms: SubscriptionWithRoom[],
): SearchFilterSuggestion[] => {
	if (!activeFilter) {
		return [];
	}

	if (activeFilter.key === 'in') {
		return rooms.slice(0, 5).map((room) => ({
			key: `in-${room.rid || room._id}`,
			group: 'rooms',
			title: `#${room.fname || room.name}`,
			description: 'Search in this room',
			value: applySearchFilterToken(filterText, activeFilter, 'in', room.name || room.fname || ''),
			icon: 'hash',
		}));
	}

	if (activeFilter.key === 'from') {
		return [
			{
				key: 'from-current',
				group: 'users',
				title: activeFilter.value ? `from:${activeFilter.value.replace(/^@/, '')}` : 'from:username',
				description: 'Search messages from this username',
				value: applySearchFilterToken(filterText, activeFilter, 'from', activeFilter.value.replace(/^@/, '')),
				icon: 'user',
			},
		];
	}

	return getDateFilterSuggestions(filterText, activeFilter, activeFilter.key);
};

const buildUserFilterSuggestions = (
	filterText: string,
	activeFilter: ActiveSearchFilter | undefined,
	users: {
		_id: string;
		name?: string;
		username: string;
	}[],
): SearchFilterSuggestion[] => {
	if (activeFilter?.key !== 'from') {
		return [];
	}

	return users.slice(0, 5).map((user) => ({
		key: `from-${user._id}`,
		group: 'users',
		title: `@${user.username}`,
		description: user.name || 'Search messages from this user',
		value: applySearchFilterToken(filterText, activeFilter, 'from', user.username),
		icon: 'user',
	}));
};

const buildUsernameAutocompleteQuery = (
	term = '',
): {
	selector: string;
} => ({ selector: JSON.stringify({ term, conditions: {}, exceptions: [] }) });

const mergeFilterSuggestions = (primary: SearchFilterSuggestion[], fallback: SearchFilterSuggestion[]): SearchFilterSuggestion[] => {
	const existingValues = new Set(primary.map(({ value }) => value));
	return [...primary, ...fallback.filter(({ value }) => !existingValues.has(value))];
};

export const useSearchItems = (
	filterText: string,
	appliedSearchFilters: SearchFilters = emptySearchFilters(),
	aiSearchActive = false,
): UseQueryResult<NavBarSearchItems, Error> => {
	const unifiedSearch = useEndpoint('GET', '/v1/search.unified');
	const usersAutocomplete = useEndpoint('GET', '/v1/users.autocomplete');
	const aiSearchFeatureEnabled = useFeaturePreview('aiSearch');
	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);
	const { data: hasIntelligentSearchLicense = false } = useHasLicenseModule(AI_LICENSE_MODULE);
	const canUseAISearch = Boolean(hasIntelligentSearchLicense && aiSearchFeatureEnabled);
	const canUseInlineFilters = Boolean(canUseAISearch && aiSearchActive);
	const { searchText, filters } = useMemo(() => {
		if (!canUseInlineFilters) {
			return { searchText: filterText, filters: emptySearchFilters() };
		}

		const parsed = parseSearchFilterText(filterText);
		return { searchText: parsed.searchText, filters: mergeSearchFilters(appliedSearchFilters, parsed.filters) };
	}, [appliedSearchFilters, canUseInlineFilters, filterText]);
	const appliedFilters = useMemo(() => (canUseInlineFilters ? buildAppliedFilterChips(filters) : []), [canUseInlineFilters, filters]);
	const [, mention, name] = useMemo(() => searchText.match(/(@|#)?(.*)/i) || [], [searchText]);
	const activeFilter = useMemo(
		() => (canUseInlineFilters ? getActiveSearchFilter(filterText) : undefined),
		[canUseInlineFilters, filterText],
	);
	const roomLookupText = useMemo(() => {
		if (!canUseInlineFilters) {
			return '';
		}

		if (activeFilter?.key === 'in') {
			return activeFilter.value.replace(/^#/, '');
		}

		return filters.roomNames[filters.roomNames.length - 1] || '';
	}, [activeFilter, canUseInlineFilters, filters.roomNames]);
	const query = useMemo(() => buildRoomSearchQuery(name, mention), [name, mention]);
	const roomLookupQuery = useMemo(
		() => (roomLookupText ? buildRoomSearchQuery(roomLookupText, '#') : emptySubscriptionQuery),
		[roomLookupText],
	);

	const localRooms = useUserSubscriptions(query, options);
	const roomFilterRooms = useUserSubscriptions(roomLookupQuery, options);
	const selectedRooms = useMemo(() => {
		if (!filters.roomNames.length) {
			return [];
		}

		return filters.roomNames
			.map((roomName) => roomFilterRooms.find(({ name, fname }) => [name, fname].filter(Boolean).includes(roomName)))
			.filter(Boolean) as SubscriptionWithRoom[];
	}, [filters.roomNames, roomFilterRooms]);
	const resolvedFilters = useMemo(
		() => ({
			...filters,
			rids: selectedRooms.map((room) => room.rid || room._id),
			...(selectedRooms[0] && { rid: selectedRooms[0].rid || selectedRooms[0]._id }),
			...(filters.fromUsernames[0] && { fromUsername: filters.fromUsernames[0] }),
		}),
		[filters, selectedRooms],
	);
	const filterSuggestions = useMemo(
		() => (canUseInlineFilters ? buildFilterSuggestions(filterText, activeFilter, roomFilterRooms) : []),
		[activeFilter, canUseInlineFilters, filterText, roomFilterRooms],
	);

	const usernamesFromClient = localRooms.map(({ t, name }) => (t === 'd' ? name : null)).filter(Boolean) as string[];

	const searchForChannels = mention === '#';
	const searchForDMs = mention === '@';

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

	return useQuery({
		queryKey: [
			'sidebar/search/spotlight',
			name,
			searchText,
			resolvedFilters,
			filterSuggestions,
			appliedFilters,
			usernamesFromClient,
			type,
			aiSearchActive,
			hasIntelligentSearchLicense,
			aiSearchFeatureEnabled,
			intelligentSearchEnabled,
			localRooms.map(({ _id, name }) => _id + name),
		],

		queryFn: async () => {
			let intelligent: UnifiedSearchIntelligentResult[] = [];
			const shouldSearchIntelligent = Boolean(aiSearchActive && name.trim() && !mention && canUseAISearch && intelligentSearchEnabled);
			if (shouldSearchIntelligent) {
				const result = await unifiedSearch({
					query: name,
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
				intelligent = result.intelligent;
			}

			const nextFilterSuggestions =
				activeFilter?.key === 'from'
					? mergeFilterSuggestions(
							buildUserFilterSuggestions(
								filterText,
								activeFilter,
								(await usersAutocomplete(buildUsernameAutocompleteQuery(activeFilter.value.replace(/^@/, '')))).items,
							),
							filterSuggestions,
						)
					: filterSuggestions;

			if (localRooms.length === LIMIT) {
				return {
					rooms: localRooms,
					intelligent,
					filterSuggestions: nextFilterSuggestions,
					appliedFilters,
					searchText,
					filters: resolvedFilters,
				};
			}

			const spotlight = await getSpotlight({
				query: name,
				usernames: usernamesFromClient.join(','),
				type: JSON.stringify(type),
			});

			const filterUsersUnique = ({ _id }: { _id: string }, index: number, arr: { _id: string }[]): boolean =>
				index === arr.findIndex((user) => _id === user._id);

			const roomFilter = (room: { t: string; uids?: string[]; _id: string; name?: string }): boolean =>
				!localRooms.find(
					(item) =>
						(room.t === 'd' && room.uids && room.uids.length > 1 && room.uids?.includes(item._id)) ||
						[item.rid, item._id].includes(room._id),
				);
			const usersFilter = (user: { _id: string }): boolean =>
				!localRooms.find((room) => room.t === 'd' && room.uids && room.uids?.length === 2 && room.uids.includes(user._id));

			const userMap = (user: {
				_id: string;
				name: string;
				username: string;
				avatarETag?: string;
			}): {
				_id: string;
				t: string;
				name: string;
				fname: string;
				avatarETag?: string;
			} => ({
				_id: user._id,
				t: 'd',
				name: user.username,
				fname: user.name,
				avatarETag: user.avatarETag,
			});

			type resultsFromServerType = {
				_id: string;
				t: string;
				name: string;
				teamMain?: boolean;
				fname?: string;
				avatarETag?: string | undefined;
				uids?: string[] | undefined;
			}[];

			const resultsFromServer: resultsFromServerType = [];
			resultsFromServer.push(...spotlight.users.filter(filterUsersUnique).filter(usersFilter).map(userMap));
			resultsFromServer.push(...spotlight.rooms.filter(roomFilter));

			const exact = resultsFromServer?.filter((item) => [item.name, item.fname].includes(name));
			return {
				rooms: Array.from(new Set([...exact, ...localRooms, ...resultsFromServer])),
				intelligent,
				filterSuggestions: nextFilterSuggestions,
				appliedFilters,
				searchText,
				filters: resolvedFilters,
			};
		},

		staleTime: 60_000,
		placeholderData: (previousData) =>
			previousData ?? { rooms: localRooms, intelligent: [], filterSuggestions, appliedFilters, searchText, filters: resolvedFilters },
	});
};
