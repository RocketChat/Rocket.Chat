import type { IOmnichannelRoom, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { minutesToMilliseconds } from 'date-fns';
import { useEffect } from 'react';

export const useOmnichannelRoomInfo = (
	roomId: string,
	{ cacheTime = minutesToMilliseconds(15), staleTime = minutesToMilliseconds(5) } = {},
) => {
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');
	const {
		data: roomData,
		refetch,
		...props
	} = useQuery(['/v1/rooms.info', roomId], () => getRoomInfo({ roomId }), { cacheTime, staleTime });
	const room = roomData?.room as unknown as Serialized<IOmnichannelRoom>;

	useEffect(() => {
		const fetchRoomInfo = async () => {
			await refetch();
		};
		fetchRoomInfo();
	}, [roomId, refetch]);

	return {
		data: room,
		refetch,
		...props,
	};
};
