import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { minutesToMilliseconds } from 'date-fns';

import { roomsQueryKeys } from '../lib/queryKeys';

export const useRoomInfoEndpoint = (rid: IRoom['_id']) => {
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');
	const uid = useUserId();
	return useQuery({
		queryKey: roomsQueryKeys.info(rid),
		queryFn: () => getRoomInfo({ roomId: rid }),
		gcTime: minutesToMilliseconds(15),

		retry: (count, error: { success: boolean; error: string }) => {
			if (count > 2 || error.error === 'not-allowed') {
				return false;
			}
			return true;
		},

		enabled: !!uid,
	});
};
