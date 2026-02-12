import type { IOmnichannelRoom, IRoom, Serialized } from '@rocket.chat/core-typings';

import { useRoomInfoEndpoint } from '../../../../hooks/useRoomInfoEndpoint';

export const useOmnichannelRoomInfo = (rid: IRoom['_id']) =>
	useRoomInfoEndpoint(rid, {
		select: (data) => (data.room as Serialized<IOmnichannelRoom>) ?? null,
	});
