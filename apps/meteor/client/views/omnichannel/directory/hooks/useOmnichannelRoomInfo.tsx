import type { IOmnichannelRoom, Serialized } from '@rocket.chat/core-typings';

import { useRoomInfoEndpoint } from '../../../../hooks/useRoomInfoEndpoint';

export const useOmnichannelRoomInfo = (roomId: string) => {
	const { data: roomData, ...props } = useRoomInfoEndpoint(roomId);
	const room = roomData?.room as unknown as Serialized<IOmnichannelRoom>;

	return {
		data: room,
		...props,
	};
};
