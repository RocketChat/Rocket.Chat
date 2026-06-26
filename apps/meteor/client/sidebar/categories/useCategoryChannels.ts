import type { RoomType } from '@rocket.chat/core-typings';
import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export type CategoryChannelOption = {
	rid: string;
	name: string;
	t: 'c' | 'p';
};

const query = { open: { $ne: false }, t: { $in: ['c', 'p'] as RoomType[] } };

/**
 * Channels (public/private) the user is subscribed to that can be put in a category:
 * everything not yet assigned to any category, plus — when `includeCategoryId` is given —
 * the channels already in that category (so "Manage channels" can show and uncheck them).
 */
export const useCategoryChannels = (categoryByRoom: Map<string, string>, includeCategoryId?: string): CategoryChannelOption[] => {
	const subscriptions = useUserSubscriptions(query);

	return useMemo(
		() =>
			subscriptions
				.filter((subscription) => {
					const categoryId = categoryByRoom.get(subscription.rid);
					return !categoryId || categoryId === includeCategoryId;
				})
				.map((subscription) => ({
					rid: subscription.rid,
					name: subscription.fname || subscription.name,
					t: subscription.t as 'c' | 'p',
				}))
				.sort((a, b) => a.name.localeCompare(b.name)),
		[subscriptions, categoryByRoom, includeCategoryId],
	);
};
