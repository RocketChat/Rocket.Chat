import { IRoom } from '@rocket.chat/core-typings';
import { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { minutesToMilliseconds } from 'date-fns';
import type { Meteor } from 'meteor/meteor';

export const useRoomInfoEndpoint = (rid: IRoom['_id']): UseQueryResult<OperationResult<'GET', '/v1/rooms.info'>> => {
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');
	return useQuery(['rooms/info', rid], () => getRoomInfo({ roomId: rid }), {
		cacheTime: minutesToMilliseconds(15),
		staleTime: minutesToMilliseconds(5),
		retry: (count, error: Meteor.Error) => {
			if (count > 2 || error.error === 'not-allowed') {
				return false;
			}
			return true;
		},
	});
};
