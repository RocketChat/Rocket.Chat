import type { IRoom } from '@rocket.chat/core-typings';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { ChatRoom } from '../../../../../app/models/client';
import { queueMicrotask } from '../../../../lib/utils/queueMicrotask';

export function useRoomQuery(
	rid: IRoom['_id'],
	options?: UseQueryOptions<IRoom | null, Error, IRoom | null, readonly ['rooms', IRoom['_id']]>,
): UseQueryResult<IRoom | null, Error> {
	const queryKey = ['rooms', rid] as const;

	const queryResult = useQuery(queryKey, async (): Promise<IRoom | null> => ChatRoom.findOne({ _id: rid }, { reactive: false }) ?? null, {
		staleTime: Infinity,
		...options,
	});

	const { refetch } = queryResult;

	useEffect(() => {
		const liveQueryHandle = ChatRoom.find({ _id: rid }).observe({
			added: () => queueMicrotask(() => refetch({ exact: false })),
			changed: () => queueMicrotask(() => refetch({ exact: false })),
			removed: () => queueMicrotask(() => refetch({ exact: false })),
		});

		return () => {
			liveQueryHandle.stop();
		};
	}, [refetch, rid]);

	return queryResult;
}
