import type { IRoom } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';
import type { Mongo } from 'meteor/mongo';
import { useEffect, useMemo } from 'react';

import { ChatRoom } from '../../../../../app/models/client';

export const useTeamsListChildrenUpdate = (
	parentRid: string,
	teamId?: string | null,
	sidepanelItems?: 'channels' | 'discussions' | null,
) => {
	const query = useMemo(() => {
		const query: Mongo.Selector<IRoom> = {
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
		queryKey: ['sidepanel', 'list', parentRid, sidepanelItems],
		queryFn: () =>
			ChatRoom.find(query, {
				sort: { lm: -1 },
			}).fetch(),
		enabled: sidepanelItems !== null && teamId !== null,
		refetchInterval: 5 * 60 * 1000,
		keepPreviousData: true,
	});

	const { refetch } = result;

	useEffect(() => {
		const liveQueryHandle = ChatRoom.find(query).observe({
			added: () => queueMicrotask(() => refetch({ exact: false })),
			changed: () => queueMicrotask(() => refetch({ exact: false })),
			removed: () => queueMicrotask(() => refetch({ exact: false })),
		});

		return () => {
			liveQueryHandle.stop();
		};
	}, [query, refetch]);

	return result;
};
