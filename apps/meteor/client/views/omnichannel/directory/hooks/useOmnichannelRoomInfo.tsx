import type { IOmnichannelRoom, Serialized } from '@rocket.chat/core-typings';
import { useStream, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { minutesToMilliseconds } from 'date-fns';
import { useEffect } from 'react';

export const useOmnichannelRoomInfo = (
	roomId: string,
	{ cacheTime = minutesToMilliseconds(15), staleTime = minutesToMilliseconds(5) } = {},
) => {
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');
	const subscribeToRoom = useStream('room-data');
	const queryClient = useQueryClient();

	const { data: roomData, ...props } = useQuery(['/v1/rooms.info', roomId], () => getRoomInfo({ roomId }), { cacheTime, staleTime });
	const room = roomData?.room as unknown as Serialized<IOmnichannelRoom>;

	useEffect(
		() =>
			subscribeToRoom(roomId, () => {
				queryClient.invalidateQueries(['/v1/rooms.info', roomId], { exact: true });
				queryClient.invalidateQueries(['/v1/livechat/rooms']);
			}),
		[queryClient, roomId, subscribeToRoom],
	);

	return {
		data: room,
		...props,
	};
};
