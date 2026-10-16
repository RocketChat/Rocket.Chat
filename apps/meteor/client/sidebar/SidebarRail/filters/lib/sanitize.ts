import type { ISidebarFilter, ISidebarFilterRule, ISidebarFiltersDisplay, ISubscriptionLabel, LabelRef } from '@rocket.chat/core-typings';
import { SUBSCRIPTION_LABEL_COLORS, SUBSCRIPTION_LABEL_ICONS, SYSTEM_LABEL_KEYS } from '@rocket.chat/core-typings';

// Preferences can be overwritten wholesale by an admin, so nothing read from them is trusted to have the expected shape.

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

const includes = <T extends string>(list: readonly T[], value: unknown): value is T => list.includes(value as T);

export const sanitizeLabels = (value: unknown): ISubscriptionLabel[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((label): ISubscriptionLabel[] => {
		if (!isObject(label) || !isNonEmptyString(label._id) || !isNonEmptyString(label.name)) {
			return [];
		}

		return [
			{
				_id: label._id,
				name: label.name,
				icon: includes(SUBSCRIPTION_LABEL_ICONS, label.icon) ? label.icon : 'tag',
				color: includes(SUBSCRIPTION_LABEL_COLORS, label.color) ? label.color : 'default',
			},
		];
	});
};

const sanitizeRef = (ref: unknown, labelIds: Set<string>): LabelRef[] => {
	if (!isObject(ref)) {
		return [];
	}

	if (ref.type === 'user' && isNonEmptyString(ref._id) && labelIds.has(ref._id)) {
		return [{ type: 'user', _id: ref._id }];
	}

	if (ref.type === 'system' && includes(SYSTEM_LABEL_KEYS, ref.key)) {
		return [{ type: 'system', key: ref.key }];
	}

	return [];
};

const sanitizeRule = (rule: unknown, labelIds: Set<string>): ISidebarFilterRule => {
	if (!isObject(rule)) {
		return { mode: 'any', labels: [] };
	}

	return {
		mode: rule.mode === 'all' ? 'all' : 'any',
		labels: Array.isArray(rule.labels) ? rule.labels.flatMap((ref) => sanitizeRef(ref, labelIds)) : [],
	};
};

export const sanitizeFilters = (value: unknown, labels: ISubscriptionLabel[]): ISidebarFilter[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	const labelIds = new Set(labels.map(({ _id }) => _id));

	return value.flatMap((filter): ISidebarFilter[] => {
		if (!isObject(filter) || !isNonEmptyString(filter._id) || !isNonEmptyString(filter.name)) {
			return [];
		}

		const sort = isObject(filter.sort) ? filter.sort : {};

		return [
			{
				_id: filter._id,
				name: filter.name,
				sort: {
					by: sort.by === 'name' ? 'name' : 'activity',
					direction: sort.direction === 'asc' ? 'asc' : 'desc',
				},
				matches: sanitizeRule(filter.matches, labelIds),
				notMatches: sanitizeRule(filter.notMatches, labelIds),
				...(filter.needsReview === true && { needsReview: true }),
			},
		];
	});
};

const VIEW_MODES = ['extended', 'medium', 'condensed'] as const;

export const sanitizeDisplay = (value: unknown, fallback: ISidebarFiltersDisplay): ISidebarFiltersDisplay => {
	if (!isObject(value)) {
		return fallback;
	}

	return {
		viewMode: includes(VIEW_MODES, value.viewMode) ? value.viewMode : fallback.viewMode,
		displayAvatar: typeof value.displayAvatar === 'boolean' ? value.displayAvatar : fallback.displayAvatar,
	};
};
