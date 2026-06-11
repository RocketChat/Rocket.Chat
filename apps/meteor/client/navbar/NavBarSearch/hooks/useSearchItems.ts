import type { UnifiedSearchIntelligentResult } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useEndpoint, useMethod, useSetting, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { getConfig } from '../../../lib/utils/getConfig';

const LIMIT = parseInt(String(getConfig('Sidebar_Search_Spotlight_LIMIT', 20)));
const MAX_ROOM_SEARCH_PATTERN_LENGTH = 64;

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

export type SearchFilters = {
	roomNames: string[];
	rids: string[];
	fromUsernames: string[];
	startDate?: string;
	endDate?: string;
	// Kept for API callers that still expect a single resolved room.
	rid?: string;
	fromUsername?: string;
};

export type NavBarSearchFormValues = {
	filterText: string;
	appliedFilters: SearchFilters;
};

export type SearchFilterSuggestion = {
	key: string;
	group: 'rooms' | 'users' | 'dates';
	title: string;
	description: string;
	value: string;
	icon: 'hash' | 'user' | 'calendar';
};

export type SearchFilterChip = {
	key: string;
	label: string;
	values: string[];
};

export const emptySearchFilters = (): SearchFilters => ({ roomNames: [], rids: [], fromUsernames: [] });

type ActiveFilter = {
	key: 'in' | 'from' | 'after' | 'before';
	value: string;
	start: number;
	end: number;
};

const FILTER_PATTERN = /(?:^|\s)(in|from|after|before):(?:"([^"]*)"|(\S+))/gi;

const normalizeFilterText = (value: string): string => value.replace(/\s+/g, ' ').trimStart();

const splitFilterValues = (value: string): string[] =>
	value
		.split(',')
		.map((item) => item.replace(/^[@#]/, '').trim())
		.filter(Boolean);

const unique = (items: string[]): string[] => Array.from(new Set(items));

export const mergeSearchFilters = (...filtersList: SearchFilters[]): SearchFilters =>
	filtersList.reduce<SearchFilters>(
		(result, filters) => ({
			roomNames: unique([...result.roomNames, ...filters.roomNames]),
			rids: unique([...result.rids, ...filters.rids]),
			fromUsernames: unique([...result.fromUsernames, ...filters.fromUsernames]),
			startDate: filters.startDate || result.startDate,
			endDate: filters.endDate || result.endDate,
			rid: filters.rid || result.rid,
			fromUsername: filters.fromUsername || result.fromUsername,
		}),
		emptySearchFilters(),
	);

export const parseSearchFilterText = (filterText: string): { searchText: string; filters: SearchFilters } => {
	const filters: SearchFilters = emptySearchFilters();
	const searchText = filterText
		.replace(FILTER_PATTERN, (_match, key: string, quotedValue?: string, bareValue?: string) => {
			const value = String(quotedValue || bareValue || '').trim();
			const values = splitFilterValues(value);
			if (!values.length) {
				return ' ';
			}

			switch (key.toLowerCase()) {
				case 'in':
					filters.roomNames.push(...values);
					break;
				case 'from':
					filters.fromUsernames.push(...values);
					break;
				case 'after':
					filters.startDate = values[0];
					break;
				case 'before':
					filters.endDate = values[0];
					break;
			}

			return ' ';
		})
		.replace(/\s+/g, ' ')
		.trim();

	return { searchText, filters };
};

export const extractCompletedSearchFilters = (
	filterText: string,
): { searchText: string; filters: SearchFilters; hasCompletedFilters: boolean } => {
	const filters: SearchFilters = emptySearchFilters();
	let hasCompletedFilters = false;
	const trimmedLength = filterText.trimEnd().length;
	const shouldKeepTrailingTokenEditable = Array.from(filterText.matchAll(FILTER_PATTERN)).length <= 1;
	const searchText = filterText
		.replace(FILTER_PATTERN, (match, key: string, quotedValue?: string, bareValue?: string, offset?: number) => {
			const start = typeof offset === 'number' ? offset : 0;
			const end = start + match.length;
			const isActiveToken = shouldKeepTrailingTokenEditable && end >= trimmedLength && !/\s$/.test(filterText);
			if (isActiveToken) {
				return match;
			}

			const values = splitFilterValues(String(quotedValue || bareValue || ''));
			if (!values.length) {
				return ' ';
			}

			hasCompletedFilters = true;
			switch (key.toLowerCase()) {
				case 'in':
					filters.roomNames.push(...values);
					break;
				case 'from':
					filters.fromUsernames.push(...values);
					break;
				case 'after':
					filters.startDate = values[0];
					break;
				case 'before':
					filters.endDate = values[0];
					break;
			}

			return ' ';
		})
		.replace(/\s+/g, ' ')
		.trimStart();

	return { searchText, filters, hasCompletedFilters };
};

const getActiveFilter = (filterText: string): ActiveFilter | undefined => {
	const match = /(?:^|\s)(in|from|after|before):([^\s]*)$/i.exec(filterText);
	if (!match) {
		return undefined;
	}

	const tokenStart = filterText.lastIndexOf(match[1], filterText.length - match[2].length - 1);
	return {
		key: match[1].toLowerCase() as ActiveFilter['key'],
		value: match[2],
		start: tokenStart,
		end: filterText.length,
	};
};

const formatFilterValue = (key: ActiveFilter['key'], value: string): string => `${key}:${/\s/.test(value) ? `"${value}"` : value}`;

const applyFilterToken = (filterText: string, activeFilter: ActiveFilter | undefined, key: ActiveFilter['key'], value: string): string => {
	const token = formatFilterValue(key, value);
	if (activeFilter) {
		return normalizeFilterText(`${filterText.slice(0, activeFilter.start)}${token} `);
	}

	return normalizeFilterText(`${filterText.trim()} ${token} `);
};

const getFilterChipLabel = (key: ActiveFilter['key'], value: string): string => {
	switch (key) {
		case 'in':
			return `#${value}`;
		case 'from':
			return `@${value}`;
		default:
			return `${key}:${value}`;
	}
};

export const buildAppliedFilterChips = (filters: SearchFilters): SearchFilterChip[] =>
	[
		filters.roomNames.length && {
			key: 'in',
			values: filters.roomNames,
			label: `in: ${filters.roomNames.map((roomName) => `#${roomName}`).join(', ')}`,
		},
		filters.fromUsernames.length && {
			key: 'from',
			values: filters.fromUsernames,
			label: `from: ${filters.fromUsernames.map((username) => `@${username}`).join(', ')}`,
		},
		filters.startDate && {
			key: 'after',
			values: [filters.startDate],
			label: getFilterChipLabel('after', filters.startDate),
		},
		filters.endDate && {
			key: 'before',
			values: [filters.endDate],
			label: getFilterChipLabel('before', filters.endDate),
		},
	].filter(Boolean) as SearchFilterChip[];

export const serializeSearchQuery = (searchText: string, filters: SearchFilters): string =>
	normalizeFilterText(
		[
			...filters.roomNames.map((roomName) => formatFilterValue('in', roomName)),
			...filters.fromUsernames.map((username) => formatFilterValue('from', username)),
			filters.startDate && formatFilterValue('after', filters.startDate),
			filters.endDate && formatFilterValue('before', filters.endDate),
			searchText,
		]
			.filter(Boolean)
			.join(' '),
	);

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

const getDateFilterSuggestions = (filterText: string, activeFilter: ActiveFilter, key: 'after' | 'before'): SearchFilterSuggestion[] => {
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
		value: applyFilterToken(filterText, activeFilter, key, value),
		icon: 'calendar',
	}));
};

const buildFilterSuggestions = (
	filterText: string,
	activeFilter: ActiveFilter | undefined,
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
			value: applyFilterToken(filterText, activeFilter, 'in', room.name || room.fname || ''),
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
				value: applyFilterToken(filterText, activeFilter, 'from', activeFilter.value.replace(/^@/, '')),
				icon: 'user',
			},
		];
	}

	return getDateFilterSuggestions(filterText, activeFilter, activeFilter.key);
};

const buildUserFilterSuggestions = (
	filterText: string,
	activeFilter: ActiveFilter | undefined,
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
		value: applyFilterToken(filterText, activeFilter, 'from', user.username),
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

export const buildRoomSearchQuery = (value: string, mention?: string) => {
	const filterRegex = new RegExp(escapeRegExp(value.slice(0, MAX_ROOM_SEARCH_PATTERN_LENGTH)), 'i');

	return {
		$or: [{ name: filterRegex }, { fname: filterRegex }],
		...(mention && {
			t: mention === '@' ? 'd' : { $ne: 'd' },
		}),
	};
};

export const useSearchItems = (
	filterText: string,
	appliedSearchFilters: SearchFilters = emptySearchFilters(),
	aiSearchActive = false,
): UseQueryResult<NavBarSearchItems, Error> => {
	const getSpotlight = useMethod('spotlight');
	const unifiedSearch = useEndpoint('GET', '/v1/search.unified');
	const usersAutocomplete = useEndpoint('GET', '/v1/users.autocomplete');
	const aiSearchFeatureEnabled = useFeaturePreview('aiSearch');
	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);
	const { data: hasIntelligentSearchLicense = false } = useHasLicenseModule('chat.rocket.rc-ai');
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
	const activeFilter = useMemo(() => (canUseInlineFilters ? getActiveFilter(filterText) : undefined), [canUseInlineFilters, filterText]);
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

			const spotlight = await getSpotlight(name, usernamesFromClient, type);

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
