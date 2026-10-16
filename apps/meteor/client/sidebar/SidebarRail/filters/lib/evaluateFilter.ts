import type { ISidebarFilter, ISidebarFilterRule, LabelRef } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { SYSTEM_LABELS } from './systemLabels';

const hasLabel = (subscription: SubscriptionWithRoom, ref: LabelRef): boolean => {
	if (ref.type === 'system') {
		return SYSTEM_LABELS[ref.key].match(subscription);
	}

	return subscription.labels?.includes(ref._id) ?? false;
};

const passesRule = (subscription: SubscriptionWithRoom, { mode, labels }: ISidebarFilterRule): boolean =>
	mode === 'all' ? labels.every((ref) => hasLabel(subscription, ref)) : labels.some((ref) => hasLabel(subscription, ref));

const referencesSystemLabel = ({ labels }: ISidebarFilterRule, key: 'hidden' | 'archived'): boolean =>
	labels.some((ref) => ref.type === 'system' && ref.key === key);

export const hasRules = (filter: ISidebarFilter): boolean => filter.matches.labels.length > 0 || filter.notMatches.labels.length > 0;

// Hidden and archived rooms stay out of every filter unless the filter asks for them, as they do in the rest of the sidebar.
export const evaluateFilter = (filter: ISidebarFilter, subscription: SubscriptionWithRoom): boolean => {
	if (filter.needsReview || !hasRules(filter)) {
		return false;
	}

	if (SYSTEM_LABELS.hidden.match(subscription) && !referencesSystemLabel(filter.matches, 'hidden')) {
		return false;
	}

	if (SYSTEM_LABELS.archived.match(subscription) && !referencesSystemLabel(filter.matches, 'archived')) {
		return false;
	}

	if (filter.matches.labels.length > 0 && !passesRule(subscription, filter.matches)) {
		return false;
	}

	return !(filter.notMatches.labels.length > 0 && passesRule(subscription, filter.notMatches));
};
