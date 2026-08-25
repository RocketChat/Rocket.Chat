import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

const query = { open: { $ne: false } };

export const useCategoryRoomIds = (categoryId: string): string[] => {
	const subscriptions = useUserSubscriptions(query);
	return useMemo(() => subscriptions.flatMap((sub) => (sub.category === categoryId ? [sub.rid] : [])), [subscriptions, categoryId]);
};
