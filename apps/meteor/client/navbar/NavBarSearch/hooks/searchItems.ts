import {
	applySearchFilterToken,
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

export const getSelectedRooms = (roomNames: string[], rooms: SubscriptionWithRoom[]): SubscriptionWithRoom[] => {
	if (!roomNames.length) {
		return [];
	}

	return roomNames
		.map((roomName) => {
			const normalizedRoomName = roomName.toLowerCase();
			return rooms.find(({ name, fname }) =>
				[name, fname].filter(Boolean).some((candidate) => candidate?.toLowerCase() === normalizedRoomName),
			);
		})
		.filter(Boolean) as SubscriptionWithRoom[];
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
	const filterRegex = new RegExp(escapeRegExp(name), 'i');
	const matchesFilter = ({ name, fname }: { name?: string; fname?: string }): boolean =>
		Boolean((name && filterRegex.test(name)) || (fname && filterRegex.test(fname)));

	const isLocalDuplicate = (item: { _id: string; t?: string; uids?: string[]; name?: string }): boolean =>
		localRooms.some((room) => {
			const sameRoom = [room.rid, room._id].includes(item._id);
			const sameGroupDM = item.t === 'd' && !!item.uids && item.uids.length > 1 && item.uids.includes(room._id);
			const sameDirectDM = item.t === 'd' && room.t === 'd' && !!room.uids && room.uids.length === 2 && room.uids.includes(item._id);
			const sameUserDM = item.t === 'd' && room.t === 'd' && item.name === room.name;
			return sameRoom || sameGroupDM || sameDirectDM || sameUserDM;
		});

	const candidates = localRooms.length < limit ? (serverResults ?? []) : [];
	const fromServer = candidates.filter((item) => matchesFilter(item) && !isLocalDuplicate(item));
	const exact = fromServer.filter((item) => [item.name, item.fname].includes(name));

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
	const users = spotlight.users
		.filter(({ _id }) => {
			if (userIds.has(_id)) {
				return false;
			}
			userIds.add(_id);
			return true;
		})
		.map(
			(user): SubscriptionWithRoom =>
				({
					_id: user._id,
					t: 'd',
					name: user.username,
					fname: user.name,
					avatarETag: user.avatarETag,
				}) as SubscriptionWithRoom,
		);

	return [...users, ...(spotlight.rooms as SubscriptionWithRoom[])];
};

export type FilterSearchState = ReturnType<typeof getFilterSearchState> & {
	appliedFilters: SearchFilterChip[];
};
