import type { IRoom } from '@rocket.chat/core-typings';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { minutesToMilliseconds } from 'date-fns';
import type { Meteor } from 'meteor/meteor';

export const useRoomInfoEndpoint = (rid: IRoom['_id']): UseQueryResult<OperationResult<'GET', '/v1/rooms.info'>> => {
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');
	const uid = useUserId();
	return useQuery({
		queryKey: ['/v1/rooms.info', rid],
		queryFn: () => getRoomInfo({ roomId: rid }),
		gcTime: minutesToMilliseconds(15),
		staleTime: minutesToMilliseconds(5),

		retry: (count, error: Meteor.Error) => {
			if (count > 2 || error.error === 'not-allowed') {
				return false;
			}
			return true;
		},

		enabled: !!uid,
	});
};
