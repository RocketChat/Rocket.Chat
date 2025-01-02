import type { IRoom } from '@rocket.chat/core-typings';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { Rooms } from '../../../../../app/models/client';
import { queueMicrotask } from '../../../../lib/utils/queueMicrotask';

export function useRoomQuery(
	rid: IRoom['_id'],
	options?: UseQueryOptions<IRoom | null, Error, IRoom | null, readonly ['rooms', IRoom['_id']]>,
): UseQueryResult<IRoom | null, Error> {
	const queryKey = ['rooms', rid] as const;

	const queryResult = useQuery({
		queryKey,
		queryFn: async (): Promise<IRoom | null> => Rooms.findOne({ _id: rid }, { reactive: false }) ?? null,
		staleTime: Infinity,
		...options,
	});

	const { refetch } = queryResult;

	useEffect(() => {
		const liveQueryHandle = Rooms.find({ _id: rid }).observe({
			added: () => queueMicrotask(() => refetch()),
			changed: () => queueMicrotask(() => refetch()),
			removed: () => queueMicrotask(() => refetch()),
		});

		return () => {
			liveQueryHandle.stop();
		};
	}, [refetch, rid]);

	return queryResult;
}
