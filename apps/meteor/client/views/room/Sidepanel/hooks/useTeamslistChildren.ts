import type { ISubscription } from '@rocket.chat/core-typings';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Mongo } from 'meteor/mongo';
import { useEffect, useMemo } from 'react';

import { Subscriptions } from '../../../../../app/models/client';
import { useSortQueryOptions } from '../../../../hooks/useSortQueryOptions';

export const useTeamsListChildrenUpdate = (
	parentRid: string,
	teamId?: string | null,
	sidepanelItems?: 'channels' | 'discussions' | null,
) => {
	const options = useSortQueryOptions();

	const query = useMemo(() => {
		const query: Mongo.Selector<ISubscription> = {
			$or: [
				{
					_id: parentRid,
				},
			],
		};

		if ((!sidepanelItems || sidepanelItems === 'discussions') && query.$or) {
			query.$or.push({
				prid: parentRid,
			});
		}

		if ((!sidepanelItems || sidepanelItems === 'channels') && teamId && query.$or) {
			query.$or.push({
				teamId,
			});
		}
		return query;
	}, [parentRid, teamId, sidepanelItems]);

	const result = useQuery({
		queryKey: ['sidepanel', 'list', parentRid, sidepanelItems, options],
		queryFn: () => Subscriptions.find(query, options).fetch(),
		enabled: sidepanelItems !== null && teamId !== null,
		refetchInterval: 5 * 60 * 1000,
		placeholderData: keepPreviousData,
	});

	const { refetch } = result;

	useEffect(() => {
		const liveQueryHandle = Subscriptions.find(query).observe({
			added: () => queueMicrotask(() => refetch()),
			changed: () => queueMicrotask(() => refetch()),
			removed: () => queueMicrotask(() => refetch()),
		});

		return () => {
			liveQueryHandle.stop();
		};
	}, [query, refetch]);

	return result;
};
