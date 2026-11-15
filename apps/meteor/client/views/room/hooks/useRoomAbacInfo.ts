import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { roomsQueryKeys } from '../../../lib/queryKeys';

type RoomAbacInfo = Pick<Serialized<OperationResult<'GET', '/v1/rooms.info'>>, 'abacRequiredAttributes' | 'classificationBanner'>;

export const useRoomAbacInfo = <TData = RoomAbacInfo>(
	rid: IRoom['_id'],
	abacAttributes: IRoom['abacAttributes'],
	{ enabled, select }: { enabled: boolean; select?: (data: RoomAbacInfo) => TData },
) => {
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');

	return useQuery({
		queryKey: roomsQueryKeys.abacInfo(rid, abacAttributes),
		queryFn: async (): Promise<RoomAbacInfo> => {
			const { abacRequiredAttributes, classificationBanner } = await getRoomInfo({ roomId: rid });
			return { abacRequiredAttributes, classificationBanner };
		},
		staleTime: 15_000,
		enabled,
		select,
	});
};
