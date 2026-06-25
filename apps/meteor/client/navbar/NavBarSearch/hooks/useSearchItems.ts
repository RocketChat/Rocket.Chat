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
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { UnifiedSearchIntelligentResult } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useEndpoint, useSetting, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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

type NavBarSearchItemsResult = {
	data: NavBarSearchItems;
	isLoading: boolean;
	isFetching: boolean;
};

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

type TranslationFn = ReturnType<typeof useTranslation>['t'];

const getDateFilterSuggestions = (
	filterText: string,
	activeFilter: ActiveSearchFilter,
	key: 'after' | 'before',
	t: TranslationFn,
): SearchFilterSuggestion[] => {
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);
	const lastWeek = new Date(today);
	lastWeek.setDate(today.getDate() - 7);

	return [
		{ label: t('Today'), value: formatDate(today) },
		{ label: t('Yesterday'), value: formatDate(yesterday) },
		{ label: t('Last_7_days'), value: formatDate(lastWeek) },
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
	t: TranslationFn,
): SearchFilterSuggestion[] => {
	if (!activeFilter) {
		return [];
	}

	if (activeFilter.key === 'in') {
		return rooms.slice(0, 5).map((room) => ({
			key: `in-${room.rid || room._id}`,
			group: 'rooms',
			title: `#${room.fname || room.name}`,
			description: t('Search_in_this_room'),
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
				description: t('Search_messages_from_this_username'),
				value: applySearchFilterToken(filterText, activeFilter, 'from', activeFilter.value.replace(/^@/, '')),
				icon: 'user',
			},
		];
	}

	return getDateFilterSuggestions(filterText, activeFilter, activeFilter.key, t);
};

const buildUserFilterSuggestions = (
	filterText: string,
	activeFilter: ActiveSearchFilter | undefined,
	users: {
		_id: string;
		name?: string;
		username: string;
	}[],
	t: TranslationFn,
): SearchFilterSuggestion[] => {
	if (activeFilter?.key !== 'from') {
		return [];
	}

	return users.slice(0, 5).map((user) => ({
		key: `from-${user._id}`,
		group: 'users',
		title: `@${user.username}`,
		description: user.name || t('Search_messages_from_this_user'),
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

const dedupeRooms = <T extends { _id: string; rid?: string }>(rooms: T[]): T[] => {
	const seen = new Set<string>();

	return rooms.filter((room) => {
		const key = room.rid || room._id;
		if (seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});
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
	const { searchText, filters } = useMemo(() => {
		if (!canUseInlineFilters) {
			return { searchText: filterText, filters: emptySearchFilters() };
		}

		const parsed = parseSearchFilterText(filterText);
		return { searchText: parsed.searchText, filters: mergeSearchFilters(appliedSearchFilters, parsed.filters) };
	}, [appliedSearchFilters, canUseInlineFilters, filterText]);
	const appliedFilters = useMemo(() => (canUseInlineFilters ? buildAppliedFilterChips(filters) : []), [canUseInlineFilters, filters]);
	const [, mention, name] = useMemo(() => searchText.match(/(@|#)?(.*)/i) || [], [searchText]);
	const debouncedSearchText = useDebouncedValue(searchText, 500);
	const [, debouncedMention, debouncedName] = useMemo(() => debouncedSearchText.match(/(@|#)?(.*)/i) || [], [debouncedSearchText]);
	const activeFilter = useMemo(
		() => (canUseInlineFilters ? getActiveSearchFilter(filterText) : undefined),
		[canUseInlineFilters, filterText],
	);
	const debouncedUserFilter = useDebouncedValue(activeFilter?.key === 'from' ? activeFilter.value.replace(/^@/, '') : '', 500);
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

			const filterUsersUnique = ({ _id }: { _id: string }, index: number, arr: { _id: string }[]): boolean =>
				index === arr.findIndex((user) => _id === user._id);

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
			resultsFromServer.push(...spotlight.users.filter(filterUsersUnique).map(userMap));
			resultsFromServer.push(...spotlight.rooms);

			return resultsFromServer;
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
		const filterRegex = new RegExp(escapeRegExp(name), 'i');
		const matchesFilter = ({ name, fname }: { name?: string; fname?: string }): boolean =>
			Boolean((name && filterRegex.test(name)) || (fname && filterRegex.test(fname)));
		const isLocalDuplicate = (item: { _id: string; t?: string; uids?: string[] }): boolean =>
			localRooms.some((room) => {
				const sameRoom = [room.rid, room._id].includes(item._id);
				const sameGroupDM = item.t === 'd' && !!item.uids && item.uids.length > 1 && item.uids.includes(room._id);
				const sameDirectDM = item.t === 'd' && room.t === 'd' && !!room.uids && room.uids.length === 2 && room.uids.includes(item._id);
				return sameRoom || sameGroupDM || sameDirectDM;
			});

		const candidates = localRooms.length < LIMIT ? (serverResults ?? []) : [];
		const fromServer = candidates.filter((item) => matchesFilter(item) && !isLocalDuplicate(item));
		const exact = fromServer.filter((item) => [item.name, item.fname].includes(name));

		return dedupeRooms([...exact, ...localRooms, ...fromServer]) as SubscriptionWithRoom[];
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
