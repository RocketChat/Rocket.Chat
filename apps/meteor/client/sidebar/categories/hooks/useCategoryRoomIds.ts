import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useCategoryRoomIds = (categoryId: string): string[] => {
	const query = useMemo(() => ({ open: { $ne: false }, category: categoryId }), [categoryId]);

	const subscriptions = useUserSubscriptions(query);
	return useMemo(() => subscriptions.map((sub) => sub.rid), [subscriptions]);
};
