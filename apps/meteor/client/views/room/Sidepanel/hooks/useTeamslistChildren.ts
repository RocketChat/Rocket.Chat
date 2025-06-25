import type { ISubscription } from '@rocket.chat/core-typings';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Filter } from 'mongodb';
import { useEffect, useMemo } from 'react';

import { Subscriptions } from '../../../../../app/models/client';

const sortOptions = { sort: { lm: -1 } } as const;

export const useTeamsListChildrenUpdate = (parentRid: string, teamId?: string | null) => {
	const query = useMemo(() => {
		const query: Filter<ISubscription> = {
			$or: [
				{
					_id: parentRid,
					prid: parentRid,
				},
			],
		};

		if (teamId && query.$or) {
			query.$or.push({
				teamId,
			});
		}
		return query;
	}, [parentRid, teamId]);

	const result = useQuery({
		queryKey: ['sidepanel', 'list', parentRid],
		queryFn: () => Subscriptions.find(query, sortOptions).fetch(),
		enabled: teamId !== null,
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
