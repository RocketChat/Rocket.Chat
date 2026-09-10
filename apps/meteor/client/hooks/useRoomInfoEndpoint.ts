import type { IRoom, ITeam, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { minutesToMilliseconds } from 'date-fns';

import { roomsQueryKeys } from '../lib/queryKeys';

type RoomInfoResponse = Serialized<{
	room: IRoom | null;
	parent?: Pick<IRoom, '_id' | 'name' | 'fname' | 't'> & Partial<Pick<IRoom, 'prid' | 'u'>>;
	team?: Pick<ITeam, 'name' | 'roomId' | 'type'>;
}>;

type UseRoomInfoEndpointOptions<TData = RoomInfoResponse> = Omit<
	UseQueryOptions<RoomInfoResponse, { success: boolean; error: string }, TData, ReturnType<typeof roomsQueryKeys.info>>,
	'queryKey' | 'queryFn'
>;

export const useRoomInfoEndpoint = <TData = RoomInfoResponse>(rid: IRoom['_id'], options?: UseRoomInfoEndpointOptions<TData>) => {
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');
	const uid = useUserId();
	return useQuery({
		queryKey: roomsQueryKeys.info(rid),
		queryFn: () => getRoomInfo({ roomId: rid }),
		gcTime: minutesToMilliseconds(15),
		retry: (count, error: { success: boolean; error: string }) => count <= 2 && error.error !== 'not-allowed',
		enabled: !!uid,
		...options,
	});
};
