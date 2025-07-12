import type { IOmnichannelRoom, Serialized } from '@rocket.chat/core-typings';

import { useRoomInfoEndpoint } from '../../../../hooks/useRoomInfoEndpoint';

export const useOmnichannelRoomInfo = (roomId: string) =>
	useRoomInfoEndpoint(roomId, {
		select: (data) => {
			const newData = data.room as Serialized<IOmnichannelRoom> | undefined;
			console.log('useOmnichannelRoomInfo', newData);
			return newData;
		},
	});
