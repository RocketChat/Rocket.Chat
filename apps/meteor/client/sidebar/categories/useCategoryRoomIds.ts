import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useCategoryRoomIds = (categoryId: string): string[] => {
	const subscriptions = useUserSubscriptions({ open: true });
	return useMemo(() => subscriptions.flatMap((sub) => (sub.category === categoryId ? [sub.rid] : [])), [subscriptions, categoryId]);
};
