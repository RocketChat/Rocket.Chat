import type { IOmnichannelGenericRoom, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useOmnichannelRoomInfo = (roomId: string) => {
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');

	const { data: roomData, ...props } = useQuery(['/v1/rooms.info', roomId], () => getRoomInfo({ roomId }));
	const room = roomData?.room as unknown as Serialized<IOmnichannelGenericRoom>;

	return {
		data: room,
		...props,
	};
};
