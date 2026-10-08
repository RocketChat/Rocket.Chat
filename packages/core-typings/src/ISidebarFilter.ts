export const SUBSCRIPTION_LABEL_ICONS = [
	'tag',
	'star',
	'flag',
	'home',
	'bell',
	'lightning',
	'folder',
	'pin',
	'rocket',
	'book',
	'leaf',
	'flask',
	'shield',
	'lamp-bulb',
	'business',
	'code',
	'calendar',
	'globe',
	'key',
	'team',
] as const;

export type SubscriptionLabelIcon = (typeof SUBSCRIPTION_LABEL_ICONS)[number];

export const SUBSCRIPTION_LABEL_COLORS = ['default', 'red', 'green', 'blue', 'yellow'] as const;

export type SubscriptionLabelColor = (typeof SUBSCRIPTION_LABEL_COLORS)[number];

export const SYSTEM_LABEL_KEYS = [
	'unread',
	'mentions',
	'threads',
	'direct',
	'public',
	'private',
	'teams',
	'favorites',
	'discussions',
	'federated',
	'hidden',
	'archived',
] as const;

export type SystemLabelKey = (typeof SYSTEM_LABEL_KEYS)[number];

export const MAX_SUBSCRIPTION_LABELS = 100;
export const MAX_SIDEBAR_FILTERS = 30;
export const MAX_LABEL_NAME_LENGTH = 40;
export const MAX_FILTER_NAME_LENGTH = 60;

export interface ISubscriptionLabel {
	_id: string;
	name: string;
	icon: SubscriptionLabelIcon;
	color: SubscriptionLabelColor;
}

export type LabelRef = { type: 'user'; _id: string } | { type: 'system'; key: SystemLabelKey };

export interface ISidebarFilterRule {
	mode: 'any' | 'all';
	labels: LabelRef[];
}

export type SidebarFilterSortBy = 'activity' | 'name';

export type SidebarFilterSortDirection = 'asc' | 'desc';

export interface ISidebarFilterSort {
	by: SidebarFilterSortBy;
	direction: SidebarFilterSortDirection;
}

export interface ISidebarFilter {
	_id: string;
	name: string;
	sort: ISidebarFilterSort;
	matches: ISidebarFilterRule;
	notMatches: ISidebarFilterRule;
	/** Set when a cascade left the filter without the rules it was built on; the filter matches nothing until edited. */
	needsReview?: true;
}

export type SidebarFiltersViewMode = 'extended' | 'medium' | 'condensed';

export interface ISidebarFiltersDisplay {
	viewMode: SidebarFiltersViewMode;
	displayAvatar: boolean;
}
