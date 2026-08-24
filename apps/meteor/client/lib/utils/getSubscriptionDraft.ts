import type { ISubscription } from '@rocket.chat/core-typings';

export const getSubscriptionDraft = (subscription: Pick<ISubscription, 'draft' | 'threadDrafts'>): string | undefined => {
	if (subscription.draft) {
		return subscription.draft;
	}

	return subscription.threadDrafts && Object.values(subscription.threadDrafts).find(Boolean);
};
