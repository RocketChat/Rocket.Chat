import {
	applySearchFilterToken,
	buildRoomSearchQuery,
	emptySearchFilters,
	getActiveSearchFilter,
	MAX_ROOM_SEARCH_PATTERN_LENGTH,
	mergeSearchFilters,
	parseSearchFilterText,
	type ActiveSearchFilter,
	type SearchFilterChip,
	type SearchFilters,
	type SearchFilterSuggestion,
} from '@rocket.chat/ai-search';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

export const emptySubscriptionQuery = { _id: '__ai_search_no_room_filter__' };

export const buildUsernameAutocompleteQuery = (
	term = '',
): {
	selector: string;
} => ({ selector: JSON.stringify({ term, conditions: {}, exceptions: [] }) });

const getDateFilterSuggestions = (
	filterText: string,
	activeFilter: ActiveSearchFilter,
	key: 'after' | 'before',
	t: TFunction,
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

export const buildFilterSuggestions = (
	filterText: string,
	activeFilter: ActiveSearchFilter | undefined,
	rooms: SubscriptionWithRoom[],
	t: TFunction,
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

export const buildUserFilterSuggestions = (
	filterText: string,
	activeFilter: ActiveSearchFilter | undefined,
	users: {
		_id: string;
		name?: string;
		username: string;
	}[],
	t: TFunction,
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

export const mergeFilterSuggestions = (primary: SearchFilterSuggestion[], fallback: SearchFilterSuggestion[]): SearchFilterSuggestion[] => {
	const existingValues = new Set(primary.map(({ value }) => value));
	return [...primary, ...fallback.filter(({ value }) => !existingValues.has(value))];
};

export const getFilterSearchState = (
	filterText: string,
	appliedSearchFilters: SearchFilters,
	canUseInlineFilters: boolean,
): {
	searchText: string;
	filters: SearchFilters;
	activeFilter: ActiveSearchFilter | undefined;
} => {
	if (!canUseInlineFilters) {
		return { searchText: filterText, filters: emptySearchFilters(), activeFilter: undefined };
	}

	const parsed = parseSearchFilterText(filterText);
	return {
		searchText: parsed.searchText,
		filters: mergeSearchFilters(appliedSearchFilters, parsed.filters),
		activeFilter: getActiveSearchFilter(filterText),
	};
};

export const getRoomLookupText = (
	activeFilter: ActiveSearchFilter | undefined,
	filters: Pick<SearchFilters, 'roomNames'>,
	canUseInlineFilters: boolean,
): string => {
	if (!canUseInlineFilters) {
		return '';
	}

	if (activeFilter?.key === 'in') {
		return activeFilter.value.replace(/^#/, '');
	}

	return filters.roomNames[filters.roomNames.length - 1] || '';
};

export const getRoomLookupQuery = (roomLookupText: string): ReturnType<typeof buildRoomSearchQuery> | typeof emptySubscriptionQuery =>
	roomLookupText ? buildRoomSearchQuery(roomLookupText, '#') : emptySubscriptionQuery;

export const getSelectedRooms = <T extends { name?: string; fname?: string }>(roomNames: string[], rooms: T[]): T[] => {
	if (!roomNames.length) {
		return [];
	}

	const roomsByName = new Map<string, T>();
	const addRoomName = (candidate: string | undefined, room: T): void => {
		if (candidate) {
			const normalizedCandidate = candidate.toLowerCase();
			if (!roomsByName.has(normalizedCandidate)) {
				roomsByName.set(normalizedCandidate, room);
			}
		}
	};
	for (const room of rooms) {
		addRoomName(room.name, room);
		addRoomName(room.fname, room);
	}

	const selectedRooms: T[] = [];
	for (const roomName of roomNames) {
		const room = roomsByName.get(roomName.toLowerCase());
		if (room) {
			selectedRooms.push(room);
		}
	}
	return selectedRooms;
};

export const resolveSearchFilters = (filters: SearchFilters, selectedRooms: SubscriptionWithRoom[]): SearchFilters => ({
	...filters,
	rids: selectedRooms.map((room) => room.rid || room._id),
	...(selectedRooms[0] && { rid: selectedRooms[0].rid || selectedRooms[0]._id }),
	...(filters.fromUsernames[0] && { fromUsername: filters.fromUsernames[0] }),
});

export const dedupeRooms = <T extends { _id: string; rid?: string }>(rooms: T[]): T[] => {
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

export const buildRooms = ({
	name,
	localRooms,
	serverResults,
	limit,
}: {
	name: string;
	localRooms: SubscriptionWithRoom[];
	serverResults: SubscriptionWithRoom[] | undefined;
	limit: number;
}): SubscriptionWithRoom[] => {
	const filterRegex = new RegExp(escapeRegExp(name.slice(0, MAX_ROOM_SEARCH_PATTERN_LENGTH)), 'i');
	const matchesFilter = ({ name, fname }: { name?: string; fname?: string }): boolean =>
		Boolean((name && filterRegex.test(name)) || (fname && filterRegex.test(fname)));
	const candidates = localRooms.length < limit ? (serverResults ?? []) : [];
	if (!candidates.length) {
		return dedupeRooms(localRooms).slice(0, limit);
	}

	const localRoomIds = new Set<string>();
	const localSubscriptionIds = new Set<string>();
	const localDirectMessageUserIds = new Set<string>();
	const localDirectMessageNames = new Set<string>();
	for (const room of localRooms) {
		localRoomIds.add(room._id);
		localRoomIds.add(room.rid);
		localSubscriptionIds.add(room._id);
		if (room.t !== 'd') {
			continue;
		}
		localDirectMessageNames.add(room.name);
		if (room.uids?.length === 2) {
			room.uids.forEach((userId) => localDirectMessageUserIds.add(userId));
		}
	}

	const isLocalDuplicate = (item: { _id: string; t?: string; uids?: string[]; name?: string }): boolean =>
		localRoomIds.has(item._id) ||
		(item.t === 'd' &&
			(((item.uids?.length ?? 0) > 1 && item.uids?.some((userId) => localSubscriptionIds.has(userId))) ||
				localDirectMessageUserIds.has(item._id) ||
				(item.name !== undefined && localDirectMessageNames.has(item.name))));

	const exact: SubscriptionWithRoom[] = [];
	const fromServer: SubscriptionWithRoom[] = [];
	for (const item of candidates) {
		if (!matchesFilter(item) || isLocalDuplicate(item)) {
			continue;
		}
		if (item.name === name || item.fname === name) {
			exact.push(item);
		} else {
			fromServer.push(item);
		}
	}

	return dedupeRooms([...exact, ...localRooms, ...fromServer]).slice(0, limit);
};

export const normalizeSpotlightResults = (spotlight: {
	users: {
		_id: string;
		name: string;
		username: string;
		avatarETag?: string;
	}[];
	rooms: {
		_id: string;
		t: string;
		name: string;
		teamMain?: boolean;
		fname?: string;
		avatarETag?: string;
		uids?: string[];
	}[];
}): SubscriptionWithRoom[] => {
	const userIds = new Set<string>();
	const users: SubscriptionWithRoom[] = [];
	for (const user of spotlight.users) {
		if (userIds.has(user._id)) {
			continue;
		}
		userIds.add(user._id);
		users.push({
			_id: user._id,
			t: 'd',
			name: user.username,
			fname: user.name,
			avatarETag: user.avatarETag,
		} as SubscriptionWithRoom);
	}

	return [...users, ...(spotlight.rooms as SubscriptionWithRoom[])];
};

export type FilterSearchState = ReturnType<typeof getFilterSearchState> & {
	appliedFilters: SearchFilterChip[];
};
