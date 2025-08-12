import type { IRoom, ITeam, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { minutesToMilliseconds } from 'date-fns';

import { roomsQueryKeys } from '../lib/queryKeys';

type UseRoomInfoEndpointOptions<
	TData = Serialized<{
		room: IRoom | undefined;
		parent?: Pick<IRoom, '_id' | 'name' | 'fname' | 't' | 'prid' | 'u' | 'sidepanel'>;
		team?: Pick<ITeam, 'name' | 'roomId' | 'type' | '_id'>;
	}>,
> = Omit<
	UseQueryOptions<
		Serialized<{
			room: IRoom | undefined;
			parent?: Pick<IRoom, '_id' | 'name' | 'fname' | 't' | 'prid' | 'u' | 'sidepanel'>;
			team?: Pick<ITeam, 'name' | 'roomId' | 'type' | '_id'>;
		}>,
		{ success: boolean; error: string },
		TData,
		ReturnType<typeof roomsQueryKeys.info>
	>,
	'queryKey' | 'queryFn'
>;

export const useRoomInfoEndpoint = <
	TData = Serialized<{
		room: IRoom | undefined;
		parent?: Pick<IRoom, '_id' | 'name' | 'fname' | 't' | 'prid' | 'u' | 'sidepanel'>;
		team?: Pick<ITeam, 'name' | 'roomId' | 'type' | '_id'>;
	}>,
>(
	rid: IRoom['_id'],
	options?: UseRoomInfoEndpointOptions<TData>,
) => {
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
