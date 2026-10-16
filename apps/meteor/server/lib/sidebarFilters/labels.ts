import type { ISidebarFilter, ISidebarFilterRule, ISubscriptionLabel, IUser } from '@rocket.chat/core-typings';
import {
	MAX_LABEL_NAME_LENGTH,
	MAX_SUBSCRIPTION_LABELS,
	SUBSCRIPTION_LABEL_COLORS,
	SUBSCRIPTION_LABEL_ICONS,
} from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';

import { updateUserFilterPreferences } from './updateUserFilterPreferences';
import { notifyOnSubscriptionsChangedByRoomIdsAndUserId } from '../notifyListener';

type LabelFields = Pick<ISubscriptionLabel, 'name' | 'icon' | 'color'>;

const nameKey = (name: string) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const validateLabelName = (name: string, labels: ISubscriptionLabel[], ignoreId?: string): string => {
	const trimmed = name.trim();
	if (!trimmed || trimmed.length > MAX_LABEL_NAME_LENGTH) {
		throw new Meteor.Error('error-invalid-label-name', `Label name must have between 1 and ${MAX_LABEL_NAME_LENGTH} characters`);
	}

	const key = nameKey(trimmed);
	if (labels.some((label) => label._id !== ignoreId && nameKey(label.name) === key)) {
		throw new Meteor.Error('error-duplicate-label-name', 'A label with this name already exists');
	}

	return trimmed;
};

const validateAppearance = ({ icon, color }: Partial<LabelFields>) => {
	if (icon !== undefined && !SUBSCRIPTION_LABEL_ICONS.includes(icon)) {
		throw new Meteor.Error('error-invalid-param', 'Invalid label icon');
	}
	if (color !== undefined && !SUBSCRIPTION_LABEL_COLORS.includes(color)) {
		throw new Meteor.Error('error-invalid-param', 'Invalid label color');
	}
};

export const createLabel = (
	uid: IUser['_id'],
	{ name, icon = 'tag', color = 'default' }: Pick<LabelFields, 'name'> & Partial<LabelFields>,
): Promise<ISubscriptionLabel> =>
	updateUserFilterPreferences(uid, ({ subscriptionLabels }) => {
		if (subscriptionLabels.length >= MAX_SUBSCRIPTION_LABELS) {
			throw new Meteor.Error('error-labels-limit-reached', `You can have at most ${MAX_SUBSCRIPTION_LABELS} labels`);
		}
		validateAppearance({ icon, color });

		const label: ISubscriptionLabel = { _id: Random.id(), name: validateLabelName(name, subscriptionLabels), icon, color };

		return { next: { subscriptionLabels: [...subscriptionLabels, label] }, result: label };
	});

export const updateLabel = (
	uid: IUser['_id'],
	labelId: ISubscriptionLabel['_id'],
	patch: Partial<LabelFields>,
): Promise<ISubscriptionLabel> =>
	updateUserFilterPreferences(uid, ({ subscriptionLabels }) => {
		const current = subscriptionLabels.find(({ _id }) => _id === labelId);
		if (!current) {
			throw new Meteor.Error('error-label-not-found', 'Label not found');
		}
		validateAppearance(patch);

		const label: ISubscriptionLabel = {
			...current,
			...(patch.name !== undefined && { name: validateLabelName(patch.name, subscriptionLabels, labelId) }),
			...(patch.icon !== undefined && { icon: patch.icon }),
			...(patch.color !== undefined && { color: patch.color }),
		};

		return {
			next: { subscriptionLabels: subscriptionLabels.map((item) => (item._id === labelId ? label : item)) },
			result: label,
		};
	});

const withoutLabel = (rule: ISidebarFilterRule, labelId: string): ISidebarFilterRule => ({
	...rule,
	labels: rule.labels.filter((ref) => ref.type !== 'user' || ref._id !== labelId),
});

/** Drops the label from a filter; a filter that loses the rules it depended on is flagged instead of silently widening. */
const removeLabelFromFilter = (filter: ISidebarFilter, labelId: string): ISidebarFilter => {
	const matches = withoutLabel(filter.matches, labelId);
	const notMatches = withoutLabel(filter.notMatches, labelId);

	if (matches.labels.length === filter.matches.labels.length && notMatches.labels.length === filter.notMatches.labels.length) {
		return filter;
	}

	const lostAllRules = matches.labels.length === 0 && notMatches.labels.length === 0;
	const lostMatches = filter.matches.labels.length > 0 && matches.labels.length === 0;

	return { ...filter, matches, notMatches, ...((lostAllRules || lostMatches) && { needsReview: true }) };
};

export const deleteLabel = async (uid: IUser['_id'], labelId: ISubscriptionLabel['_id']): Promise<void> => {
	await updateUserFilterPreferences(uid, ({ subscriptionLabels, sidebarFilters }) => {
		if (!subscriptionLabels.some(({ _id }) => _id === labelId)) {
			throw new Meteor.Error('error-label-not-found', 'Label not found');
		}

		return {
			next: {
				subscriptionLabels: subscriptionLabels.filter(({ _id }) => _id !== labelId),
				sidebarFilters: sidebarFilters.map((filter) => removeLabelFromFilter(filter, labelId)),
			},
			result: undefined,
		};
	});

	const roomIds = (await Subscriptions.find({ 'u._id': uid, 'labels': labelId }, { projection: { rid: 1 } }).toArray()).map(
		({ rid }) => rid,
	);
	if (!roomIds.length) {
		return;
	}

	await Subscriptions.removeLabelFromUserSubscriptions(uid, labelId);
	void notifyOnSubscriptionsChangedByRoomIdsAndUserId(roomIds, uid);
};
