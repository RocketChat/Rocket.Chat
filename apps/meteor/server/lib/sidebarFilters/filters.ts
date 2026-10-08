import type { ISidebarFilter, ISidebarFilterRule, ISubscriptionLabel, IUser, LabelRef } from '@rocket.chat/core-typings';
import { MAX_FILTER_NAME_LENGTH, MAX_SIDEBAR_FILTERS, SYSTEM_LABEL_KEYS } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';

import { updateUserFilterPreferences } from './updateUserFilterPreferences';

export type SidebarFilterFields = Pick<ISidebarFilter, 'name' | 'sort' | 'matches' | 'notMatches'>;

const refKey = (ref: LabelRef) => (ref.type === 'user' ? `user:${ref._id}` : `system:${ref.key}`);

const validateFilterName = (name: string): string => {
	const trimmed = name.trim();
	if (!trimmed || trimmed.length > MAX_FILTER_NAME_LENGTH) {
		throw new Meteor.Error('error-invalid-filter-name', `Filter name must have between 1 and ${MAX_FILTER_NAME_LENGTH} characters`);
	}
	return trimmed;
};

const validateRule = ({ mode, labels }: ISidebarFilterRule, userLabels: ISubscriptionLabel[]): ISidebarFilterRule => {
	const keys = labels.map(refKey);
	if (new Set(keys).size !== keys.length) {
		throw new Meteor.Error('error-invalid-filter-rule', 'A filter rule cannot reference the same label twice');
	}

	for (const ref of labels) {
		const exists =
			ref.type === 'user' ? userLabels.some(({ _id }) => _id === ref._id) : (SYSTEM_LABEL_KEYS as readonly string[]).includes(ref.key);
		if (!exists) {
			throw new Meteor.Error('error-label-not-found', 'A filter rule references a label that does not exist');
		}
	}

	return {
		mode,
		labels: labels.map((ref) => (ref.type === 'user' ? { type: 'user', _id: ref._id } : { type: 'system', key: ref.key })),
	};
};

const validateFilterFields = ({ name, sort, matches, notMatches }: SidebarFilterFields, userLabels: ISubscriptionLabel[]) => {
	if (matches.labels.length === 0 && notMatches.labels.length === 0) {
		throw new Meteor.Error('error-filter-without-rules', 'A filter needs at least one label in its rules');
	}

	return {
		name: validateFilterName(name),
		sort: { by: sort.by, direction: sort.direction },
		matches: validateRule(matches, userLabels),
		notMatches: validateRule(notMatches, userLabels),
	};
};

const assertBelowLimit = (filters: ISidebarFilter[]) => {
	if (filters.length >= MAX_SIDEBAR_FILTERS) {
		throw new Meteor.Error('error-filters-limit-reached', `You can have at most ${MAX_SIDEBAR_FILTERS} filters`);
	}
};

const findFilterIndex = (filters: ISidebarFilter[], filterId: ISidebarFilter['_id']) => {
	const index = filters.findIndex(({ _id }) => _id === filterId);
	if (index === -1) {
		throw new Meteor.Error('error-filter-not-found', 'Filter not found');
	}
	return index;
};

export const createFilter = (uid: IUser['_id'], fields: SidebarFilterFields): Promise<ISidebarFilter> =>
	updateUserFilterPreferences(uid, ({ subscriptionLabels, sidebarFilters }) => {
		assertBelowLimit(sidebarFilters);

		const filter: ISidebarFilter = { _id: Random.id(), ...validateFilterFields(fields, subscriptionLabels) };

		return { next: { sidebarFilters: [...sidebarFilters, filter] }, result: filter };
	});

export const updateFilter = (uid: IUser['_id'], filterId: ISidebarFilter['_id'], fields: SidebarFilterFields): Promise<ISidebarFilter> =>
	updateUserFilterPreferences(uid, ({ subscriptionLabels, sidebarFilters }) => {
		const index = findFilterIndex(sidebarFilters, filterId);

		const filter: ISidebarFilter = { _id: filterId, ...validateFilterFields(fields, subscriptionLabels) };

		return { next: { sidebarFilters: sidebarFilters.map((item, i) => (i === index ? filter : item)) }, result: filter };
	});

export const deleteFilter = async (uid: IUser['_id'], filterId: ISidebarFilter['_id']): Promise<void> =>
	updateUserFilterPreferences(uid, ({ sidebarFilters }) => {
		findFilterIndex(sidebarFilters, filterId);

		return { next: { sidebarFilters: sidebarFilters.filter(({ _id }) => _id !== filterId) }, result: undefined };
	});

export const duplicateFilter = (uid: IUser['_id'], filterId: ISidebarFilter['_id'], name: string): Promise<ISidebarFilter> =>
	updateUserFilterPreferences(uid, ({ sidebarFilters }) => {
		assertBelowLimit(sidebarFilters);
		const index = findFilterIndex(sidebarFilters, filterId);

		const filter: ISidebarFilter = { ...sidebarFilters[index], _id: Random.id(), name: validateFilterName(name) };

		return {
			next: { sidebarFilters: [...sidebarFilters.slice(0, index + 1), filter, ...sidebarFilters.slice(index + 1)] },
			result: filter,
		};
	});

export const reorderFilters = async (uid: IUser['_id'], filterIds: ISidebarFilter['_id'][]): Promise<void> =>
	updateUserFilterPreferences(uid, ({ sidebarFilters }) => {
		const byId = new Map(sidebarFilters.map((filter) => [filter._id, filter]));
		const reordered = filterIds.flatMap((id) => byId.get(id) ?? []);
		if (reordered.length !== sidebarFilters.length || new Set(filterIds).size !== filterIds.length) {
			throw new Meteor.Error('error-invalid-filter-order', 'The new order must list every existing filter exactly once');
		}

		return { next: { sidebarFilters: reordered }, result: undefined };
	});
