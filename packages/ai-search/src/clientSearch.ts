import { MAX_ROOM_SEARCH_PATTERN_LENGTH } from './constants';

export type SearchFilters = {
	roomNames: string[];
	rids: string[];
	fromUsernames: string[];
	startDate?: string;
	endDate?: string;
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

export type ActiveSearchFilter = {
	key: 'in' | 'from' | 'after' | 'before';
	value: string;
	start: number;
	end: number;
};

const FILTER_PATTERN = /(?:^|\s)(in|from|after|before):(?:"([^"]*)"|(\S+))/gi;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeFilterText = (value: string): string => value.replace(/\s+/g, ' ').trimStart();

const splitFilterValues = (value: string): string[] =>
	value
		.split(',')
		.map((item) => item.replace(/^[@#]/, '').trim())
		.filter(Boolean);

const unique = (items: string[]): string[] => Array.from(new Set(items));

export const emptySearchFilters = (): SearchFilters => ({ roomNames: [], rids: [], fromUsernames: [] });

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

export const getActiveSearchFilter = (filterText: string): ActiveSearchFilter | undefined => {
	const match = /(?:^|\s)(in|from|after|before):([^\s]*)$/i.exec(filterText);
	if (!match) {
		return undefined;
	}

	const tokenStart = filterText.lastIndexOf(match[1], filterText.length - match[2].length - 1);
	return {
		key: match[1].toLowerCase() as ActiveSearchFilter['key'],
		value: match[2],
		start: tokenStart,
		end: filterText.length,
	};
};

export const formatSearchFilterValue = (key: ActiveSearchFilter['key'], value: string): string =>
	`${key}:${/\s/.test(value) ? `"${value}"` : value}`;

export const applySearchFilterToken = (
	filterText: string,
	activeFilter: ActiveSearchFilter | undefined,
	key: ActiveSearchFilter['key'],
	value: string,
): string => {
	const token = formatSearchFilterValue(key, value);
	if (activeFilter) {
		return normalizeFilterText(`${filterText.slice(0, activeFilter.start)}${token} `);
	}

	return normalizeFilterText(`${filterText.trim()} ${token} `);
};

const getFilterChipLabel = (key: ActiveSearchFilter['key'], value: string): string => {
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
			...filters.roomNames.map((roomName) => formatSearchFilterValue('in', roomName)),
			...filters.fromUsernames.map((username) => formatSearchFilterValue('from', username)),
			filters.startDate && formatSearchFilterValue('after', filters.startDate),
			filters.endDate && formatSearchFilterValue('before', filters.endDate),
			searchText,
		]
			.filter(Boolean)
			.join(' '),
	);

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
	t,
}: {
	hasIntelligentSearchLicense: boolean;
	intelligentSearchEnabled: boolean;
	t: (key: string) => string;
}): string => {
	if (!hasIntelligentSearchLicense) {
		return t('AI_Search_license_required_tooltip');
	}

	if (!intelligentSearchEnabled) {
		return t('AI_Search_disabled_tooltip');
	}

	return t('Search_with_AI');
};
