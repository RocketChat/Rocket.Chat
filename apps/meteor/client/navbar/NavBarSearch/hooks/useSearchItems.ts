import type { UnifiedSearchIntelligentResult } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useEndpoint, useMethod, useSetting, useUserSubscriptions } from '@rocket.chat/ui-contexts';
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

export type SearchFilterSuggestion = {
	key: string;
	title: string;
	description: string;
	value: string;
};

export type SearchFilterChip = {
	key: string;
	label: string;
	nextFilterText: string;
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

export const parseSearchFilterText = (filterText: string): { searchText: string; filters: SearchFilters } => {
	const filters: SearchFilters = emptySearchFilters();
	const searchText = filterText
		.replace(FILTER_PATTERN, (_match, key: string, quotedValue?: string, bareValue?: string) => {
			const value = String(quotedValue || bareValue || '')
				.replace(/^[@#]/, '')
				.trim();
			if (!value) {
				return ' ';
			}

			switch (key.toLowerCase()) {
				case 'in':
					filters.roomNames.push(value);
					break;
				case 'from':
					filters.fromUsernames.push(value);
					break;
				case 'after':
					filters.startDate = value;
					break;
				case 'before':
					filters.endDate = value;
					break;
			}

			return ' ';
		})
		.replace(/\s+/g, ' ')
		.trim();

	return { searchText, filters };
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

export const buildAppliedFilterChips = (filterText: string): SearchFilterChip[] =>
	Array.from(filterText.matchAll(FILTER_PATTERN))
		.map((match) => {
			const key = match[1].toLowerCase() as ActiveFilter['key'];
			const value = String(match[2] || match[3] || '')
				.replace(/^[@#]/, '')
				.trim();

			if (!value || match.index === undefined) {
				return undefined;
			}

			const start = match.index;
			const end = start + match[0].length;

			return {
				key: `${key}-${value}-${start}`,
				label: getFilterChipLabel(key, value),
				nextFilterText: normalizeFilterText(`${filterText.slice(0, start)} ${filterText.slice(end)}`),
			};
		})
		.filter(Boolean) as SearchFilterChip[];

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
		title: `${key}:${value}`,
		description: label,
		value: applyFilterToken(filterText, activeFilter, key, value),
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
			title: `#${room.fname || room.name}`,
			description: 'Search in this room',
			value: applyFilterToken(filterText, activeFilter, 'in', room.name || room.fname || ''),
		}));
	}

	if (activeFilter.key === 'from') {
		return [
			{
				key: 'from-current',
				title: activeFilter.value ? `from:${activeFilter.value.replace(/^@/, '')}` : 'from:username',
				description: 'Search messages from this username',
				value: applyFilterToken(filterText, activeFilter, 'from', activeFilter.value.replace(/^@/, '')),
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
		title: `@${user.username}`,
		description: user.name || 'Search messages from this user',
		value: applyFilterToken(filterText, activeFilter, 'from', user.username),
	}));
};

export const buildRoomSearchQuery = (value: string, mention?: string) => {
	const filterRegex = new RegExp(escapeRegExp(value), 'i');

	return {
		$or: [{ name: filterRegex }, { fname: filterRegex }],
		...(mention && {
			t: mention === '@' ? 'd' : { $ne: 'd' },
		}),
	};
};

export const useSearchItems = (filterText: string): UseQueryResult<NavBarSearchItems, Error> => {
	const getSpotlight = useMethod('spotlight');
	const unifiedSearch = useEndpoint('GET', '/v1/search.unified');
	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);
	const showIntelligentSearch = useSetting('AI_Intelligent_Search_Show_In_Top_Bar', true);
	const { data: hasIntelligentSearchLicense = false } = useHasLicenseModule('chat.rocket.rc-ai');
	const { searchText, filters } = useMemo(
		() => (hasIntelligentSearchLicense ? parseSearchFilterText(filterText) : { searchText: filterText, filters: emptySearchFilters() }),
		[filterText, hasIntelligentSearchLicense],
	);
	const appliedFilters = useMemo(
		() => (hasIntelligentSearchLicense ? buildAppliedFilterChips(filterText) : []),
		[filterText, hasIntelligentSearchLicense],
	);
	const [, mention, name] = useMemo(() => searchText.match(/(@|#)?(.*)/i) || [], [searchText]);
	const activeFilter = useMemo(
		() => (hasIntelligentSearchLicense ? getActiveFilter(filterText) : undefined),
		[filterText, hasIntelligentSearchLicense],
	);
	const roomLookupText = useMemo(() => {
		if (!hasIntelligentSearchLicense) {
			return '';
		}

		if (activeFilter?.key === 'in') {
			return activeFilter.value.replace(/^#/, '');
		}

		return filters.roomNames[filters.roomNames.length - 1] || '';
	}, [activeFilter, filters.roomNames, hasIntelligentSearchLicense]);
	const query = useMemo(() => buildRoomSearchQuery(name, mention), [name, mention]);
	const roomLookupQuery = useMemo(() => buildRoomSearchQuery(roomLookupText, '#'), [roomLookupText]);

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
		() => (hasIntelligentSearchLicense ? buildFilterSuggestions(filterText, activeFilter, roomFilterRooms) : []),
		[activeFilter, filterText, hasIntelligentSearchLicense, roomFilterRooms],
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
			hasIntelligentSearchLicense,
			intelligentSearchEnabled,
			showIntelligentSearch,
			localRooms.map(({ _id, name }) => _id + name),
		],

		queryFn: async () => {
			let intelligent: UnifiedSearchIntelligentResult[] = [];
			const shouldSearchIntelligent = Boolean(
				name.trim() && !mention && hasIntelligentSearchLicense && intelligentSearchEnabled && showIntelligentSearch,
			);
			if (shouldSearchIntelligent) {
				const result = await unifiedSearch({
					query: name,
					count: 0,
					includeSpotlight: false,
					intelligentCount: 3,
					includeMessages: false,
					includeIntelligent: true,
					rid: resolvedFilters.rid,
					rids: resolvedFilters.rids.join(','),
					roomNames: resolvedFilters.roomNames.join(','),
					fromUsername: resolvedFilters.fromUsername,
					fromUsernames: resolvedFilters.fromUsernames.join(','),
					startDate: resolvedFilters.startDate,
					endDate: resolvedFilters.endDate,
				});
				intelligent = result.intelligent;
			}

			const nextFilterSuggestions =
				activeFilter?.key === 'from'
					? buildUserFilterSuggestions(
							filterText,
							activeFilter,
							(await getSpotlight(activeFilter.value.replace(/^@/, ''), [], { users: true, rooms: false })).users,
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
