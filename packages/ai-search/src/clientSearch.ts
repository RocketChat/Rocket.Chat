import { AI_SEARCH_FILTER_SUGGESTION_LIMIT, MAX_ROOM_SEARCH_PATTERN_LENGTH, MAX_SEARCH_FILTER_VALUES } from './constants';

export const SEARCH_FILTER_KEYS = ['in', 'from', 'after', 'before'] as const;

export type SearchFilterKey = (typeof SEARCH_FILTER_KEYS)[number];

export type SearchFilterGroup = 'rooms' | 'users' | 'dates';

export type SearchFilterIcon = 'hash' | 'user' | 'calendar';

export type SearchFilterMeta = { rid?: string };

export type AppliedFilter = {
	id: string;
	key: SearchFilterKey;
	value: string;
	meta?: SearchFilterMeta;
};

export type DraftSearchFilter = { key: SearchFilterKey; value: string };

export type SearchQuery = { text: string; filters: AppliedFilter[] };

export type NavBarSearchFormValues = { filterText: string; filters: AppliedFilter[] };

export type SearchFilterSuggestion = {
	key: string;
	filterKey: SearchFilterKey;
	group: SearchFilterGroup;
	title: string;
	description: string;
	value: string;
	icon: SearchFilterIcon;
	meta?: SearchFilterMeta;
};

export type SearchRoomSuggestionSource = {
	_id: string;
	rid?: string;
	name?: string;
	fname?: string;
};

export type SearchUserSuggestionSource = {
	_id: string;
	name?: string;
	username: string;
};

type TranslateFn = (key: string, options?: Record<string, string>) => string;

type SearchFilterConfig = {
	group: SearchFilterGroup;
	icon: SearchFilterIcon;
	multiple: boolean;
	pillLabel: string;
	normalize(rawValue: string): string | undefined;
	label(value: string): string;
	title(value: string, t: TranslateFn): string;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripSigil = (value: string): string => value.replace(/^[@#]/, '').trim();

const normalizeName = (rawValue: string): string | undefined => stripSigil(rawValue) || undefined;

const normalizeDate = (rawValue: string): string | undefined => {
	const value = rawValue.trim();

	return ISO_DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value)) ? value : undefined;
};

export const SEARCH_FILTERS: Record<SearchFilterKey, SearchFilterConfig> = {
	in: {
		group: 'rooms',
		icon: 'hash',
		multiple: true,
		pillLabel: 'Search_filter_in',
		normalize: normalizeName,
		label: (value) => `#${value}`,
		title: (value, t) => t('Search_filter_in_rooms', { rooms: `#${value}` }),
	},
	from: {
		group: 'users',
		icon: 'user',
		multiple: true,
		pillLabel: 'Search_filter_from',
		normalize: normalizeName,
		label: (value) => `@${value}`,
		title: (value, t) => t('Search_filter_from_users', { users: `@${value}` }),
	},
	after: {
		group: 'dates',
		icon: 'calendar',
		multiple: false,
		pillLabel: 'Search_filter_after',
		normalize: normalizeDate,
		label: (value) => `after:${value}`,
		title: (value, t) => t('Search_filter_after_date', { date: value }),
	},
	before: {
		group: 'dates',
		icon: 'calendar',
		multiple: false,
		pillLabel: 'Search_filter_before',
		normalize: normalizeDate,
		label: (value) => `before:${value}`,
		title: (value, t) => t('Search_filter_before_date', { date: value }),
	},
};

const FILTER_PATTERN = new RegExp(`(?:^|\\s)(${SEARCH_FILTER_KEYS.join('|')}):(?:"([^"]*)"|(\\S*))`, 'gi');

export const isSearchFilterKey = (value: string): value is SearchFilterKey => value in SEARCH_FILTERS;

export const getSearchFilterConfig = (key: SearchFilterKey): SearchFilterConfig => SEARCH_FILTERS[key];

export const getAppliedFilterLabel = ({ key, value }: AppliedFilter): string => SEARCH_FILTERS[key].label(value);

export const getAppliedFilterTitle = ({ key, value }: AppliedFilter, t: TranslateFn): string => SEARCH_FILTERS[key].title(value, t);

export const createAppliedFilter = (key: SearchFilterKey, rawValue: string, meta?: SearchFilterMeta): AppliedFilter | undefined => {
	const value = SEARCH_FILTERS[key].normalize(rawValue);

	if (!value) {
		return undefined;
	}

	return { id: `${key}:${value.toLowerCase()}`, key, value, ...(meta && { meta }) };
};

export const mergeAppliedFilters = (current: AppliedFilter[], incoming: AppliedFilter[]): AppliedFilter[] => {
	let next = current;

	for (const filter of incoming) {
		if (!SEARCH_FILTERS[filter.key].multiple) {
			const index = next.findIndex(({ key }) => key === filter.key);
			next = index === -1 ? [...next, filter] : next.map((item, position) => (position === index ? filter : item));
			continue;
		}

		const existing = next.find(({ id }) => id === filter.id);

		if (existing) {
			// a suggestion carries the resolved room id, a typed token does not: keep the richer entry
			next = filter.meta && !existing.meta ? next.map((item) => (item.id === filter.id ? filter : item)) : next;
			continue;
		}

		if (next.length >= MAX_SEARCH_FILTER_VALUES) {
			continue;
		}

		next = [...next, filter];
	}

	return next;
};

export const removeAppliedFilter = (filters: AppliedFilter[], id: string): AppliedFilter[] => filters.filter((filter) => filter.id !== id);

export const parseSearchInput = (
	input: string,
	{ keepDraft = false }: { keepDraft?: boolean } = {},
): { text: string; filters: AppliedFilter[]; draft?: DraftSearchFilter } => {
	const parsed: AppliedFilter[] = [];
	let draft: DraftSearchFilter | undefined;
	const lastEditableIndex = input.trimEnd().length;
	const isTyping = !/\s$/.test(input);

	const text = input.replace(FILTER_PATTERN, (match, rawKey: string, quotedValue?: string, bareValue?: string, offset?: number) => {
		const key = rawKey.toLowerCase();

		if (!isSearchFilterKey(key)) {
			return match;
		}

		const rawValue = quotedValue ?? bareValue ?? '';
		const end = (offset ?? 0) + match.length;

		if (keepDraft && isTyping && end >= lastEditableIndex) {
			draft = { key, value: rawValue };
			return match;
		}

		const rawValues = quotedValue === undefined && SEARCH_FILTERS[key].multiple ? rawValue.split(',') : [rawValue];
		const filters = rawValues.reduce<AppliedFilter[]>((accumulator, value) => {
			const filter = createAppliedFilter(key, value);
			return filter ? [...accumulator, filter] : accumulator;
		}, []);

		if (!filters.length) {
			return match;
		}

		parsed.push(...filters);
		return ' ';
	});

	const collapsed = text.replace(/\s+/g, ' ');

	return {
		text: keepDraft ? collapsed.trimStart() : collapsed.trim(),
		filters: mergeAppliedFilters([], parsed),
		...(draft && { draft }),
	};
};

export const removeDraftFilter = (input: string): string =>
	input
		.replace(new RegExp(`(?:^|\\s)(${SEARCH_FILTER_KEYS.join('|')}):(?:"[^"]*"|\\S*)\\s*$`, 'i'), ' ')
		.replace(/\s+/g, ' ')
		.trim();

const formatFilterValue = (value: string): string => (/[\s,"]/.test(value) ? `"${value.replace(/"/g, '')}"` : value);

export const serializeSearchQuery = ({ text, filters }: SearchQuery): string =>
	[...filters.map(({ key, value }) => `${key}:${formatFilterValue(value)}`), text].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

const filterValues = (filters: AppliedFilter[], key: SearchFilterKey): AppliedFilter[] => filters.filter((filter) => filter.key === key);

export const toAISearchParams = ({ text, filters }: SearchQuery) => {
	const rooms = filterValues(filters, 'in');
	const rids = rooms.map(({ meta }) => meta?.rid).filter((rid): rid is string => Boolean(rid));
	const roomNames = rooms.filter(({ meta }) => !meta?.rid).map(({ value }) => value);
	const fromUsernames = filterValues(filters, 'from').map(({ value }) => value);
	const [after] = filterValues(filters, 'after');
	const [before] = filterValues(filters, 'before');

	return {
		query: text,
		...(rids.length && { rids: rids.join(',') }),
		...(roomNames.length && { roomNames: roomNames.join(',') }),
		...(fromUsernames.length && { fromUsernames: fromUsernames.join(',') }),
		...(after && { startDate: after.value }),
		...(before && { endDate: before.value }),
	};
};

const formatDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
};

const buildDateFilterSuggestions = (key: 'after' | 'before', t: TranslateFn): SearchFilterSuggestion[] => {
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);
	const lastWeek = new Date(today);
	lastWeek.setDate(today.getDate() - 7);

	return [
		{ description: t('Today'), value: formatDate(today) },
		{ description: t('Yesterday'), value: formatDate(yesterday) },
		{ description: t('Last_7_days'), value: formatDate(lastWeek) },
	].map(({ description, value }) => ({
		key: `${key}-${value}`,
		filterKey: key,
		group: 'dates',
		title: `${key}:${value}`,
		description,
		value,
		icon: 'calendar',
	}));
};

export const buildFilterSuggestions = (
	draft: DraftSearchFilter | undefined,
	rooms: SearchRoomSuggestionSource[],
	t: TranslateFn,
): SearchFilterSuggestion[] => {
	if (!draft) {
		return [];
	}

	if (draft.key === 'in') {
		return rooms.slice(0, AI_SEARCH_FILTER_SUGGESTION_LIMIT).map((room) => ({
			key: `in-${room.rid || room._id}`,
			filterKey: 'in',
			group: 'rooms',
			title: `#${room.fname || room.name}`,
			description: t('Search_in_this_room'),
			value: room.name || room.fname || '',
			icon: 'hash',
			meta: { rid: room.rid || room._id },
		}));
	}

	if (draft.key === 'from') {
		const value = stripSigil(draft.value);

		return [
			{
				key: 'from-current',
				filterKey: 'from',
				group: 'users',
				title: value ? `from:${value}` : 'from:username',
				description: t('Search_messages_from_this_username'),
				value,
				icon: 'user',
			},
		];
	}

	return buildDateFilterSuggestions(draft.key, t);
};

export const buildUserFilterSuggestions = (
	draft: DraftSearchFilter | undefined,
	users: SearchUserSuggestionSource[],
	t: TranslateFn,
): SearchFilterSuggestion[] => {
	if (draft?.key !== 'from') {
		return [];
	}

	return users.slice(0, AI_SEARCH_FILTER_SUGGESTION_LIMIT).map((user) => ({
		key: `from-${user._id}`,
		filterKey: 'from',
		group: 'users',
		title: `@${user.username}`,
		description: user.name || t('Search_messages_from_this_user'),
		value: user.username,
		icon: 'user',
	}));
};

export const mergeFilterSuggestions = (primary: SearchFilterSuggestion[], fallback: SearchFilterSuggestion[]): SearchFilterSuggestion[] => {
	const existingValues = new Set(primary.map(({ filterKey, value }) => `${filterKey}:${value}`));

	return [...primary, ...fallback.filter(({ filterKey, value }) => !existingValues.has(`${filterKey}:${value}`))];
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

export const getAISearchButtonTooltip = ({
	hasIntelligentSearchLicense,
	intelligentSearchEnabled,
	aiSearchActive,
	t,
}: {
	hasIntelligentSearchLicense: boolean;
	intelligentSearchEnabled: boolean;
	aiSearchActive: boolean;
	t: (key: string) => string;
}): string => {
	if (!hasIntelligentSearchLicense) {
		return t('AI_Search_license_required_tooltip');
	}

	if (!intelligentSearchEnabled) {
		return t('AI_Search_disabled_tooltip');
	}

	return t(aiSearchActive ? 'Disable_AI_Search' : 'Enable_AI_Search');
};
