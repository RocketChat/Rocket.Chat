import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { useSortQueryOptions } from '../../../../hooks/useSortQueryOptions';
import { applyQueryOptions } from '../../../../lib/cachedCollections';
import { Subscriptions } from '../../../../stores';

export const useTeamsListChildrenUpdate = (
	parentRid: string,
	teamId?: string | null,
	sidepanelItems?: 'channels' | 'discussions' | null,
) => {
	const options = useSortQueryOptions();

	const predicate = useCallback(
		(record: SubscriptionWithRoom): boolean => {
			return (
				((!sidepanelItems || sidepanelItems === 'channels') && teamId && record.teamId === teamId) ||
				((!sidepanelItems || sidepanelItems === 'discussions') && record.prid === parentRid) ||
				record._id === parentRid
			);
		},
		[parentRid, sidepanelItems, teamId],
	);

	const result = useQuery({
		queryKey: ['sidepanel', 'list', parentRid, sidepanelItems, options],
		queryFn: () => applyQueryOptions(Subscriptions.state.filter(predicate), options),
		enabled: sidepanelItems !== null && teamId !== null,
		refetchInterval: 5 * 60 * 1000,
		placeholderData: keepPreviousData,
	});

	const { refetch } = result;

	useEffect(() => Subscriptions.use.subscribe(() => refetch()), [predicate, refetch]);

	return result;
};
