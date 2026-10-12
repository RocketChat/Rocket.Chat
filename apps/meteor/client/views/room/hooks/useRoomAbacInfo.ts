import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { roomsQueryKeys } from '../../../lib/queryKeys';
import { useIsABACAvailable } from '../../admin/ABAC/hooks/useIsABACAvailable';

type RoomAbacInfo = Pick<Serialized<OperationResult<'GET', '/v1/rooms.info'>>, 'abacRequiredAttributes'>;

export const useRoomAbacInfo = <TData = RoomAbacInfo>(
	rid: IRoom['_id'],
	abacAttributes: IRoom['abacAttributes'],
	select?: (data: RoomAbacInfo) => TData,
) => {
	const isABACAvailable = useIsABACAvailable();
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');

	return useQuery({
		queryKey: roomsQueryKeys.abacInfo(rid, abacAttributes, isABACAvailable),
		queryFn: async (): Promise<RoomAbacInfo> => {
			if (!isABACAvailable) {
				return {};
			}

			const { abacRequiredAttributes } = await getRoomInfo({ roomId: rid });
			return { abacRequiredAttributes };
		},
		select,
	});
};
