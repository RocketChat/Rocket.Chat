import type { IRoom } from '@rocket.chat/core-typings';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { Rooms } from '../../../../../app/models/client';
import { RoomNotFoundError } from '../../../../lib/errors/RoomNotFoundError';
import { roomsQueryKeys } from '../../../../lib/queryKeys';

export function useRoomQuery(
	rid: IRoom['_id'],
	options?: UseQueryOptions<IRoom, Error, IRoom, readonly ['rooms', IRoom['_id']]>,
): UseQueryResult<IRoom, Error> {
	const queryResult = useQuery({
		queryKey: roomsQueryKeys.room(rid),
		queryFn: async () => {
			const room = Rooms.findOne({ _id: rid }, { reactive: false });

			if (!room) {
				throw new RoomNotFoundError(undefined, { rid });
			}

			return room;
		},
		staleTime: Infinity,
		...options,
	});

	const { refetch } = queryResult;

	useEffect(() => {
		const liveQueryHandle = Rooms.find({ _id: rid }).observe({
			added: () => refetch(),
			changed: () => refetch(),
			removed: () => refetch(),
		});

		return () => {
			liveQueryHandle.stop();
		};
	}, [refetch, rid]);

	return queryResult;
}
