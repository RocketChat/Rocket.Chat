import type { IRoom } from '@rocket.chat/core-typings';

import { accounts } from '../../meteor/facade/accounts';
import { Rooms } from '../../stores';

export const getUidDirectMessage = (rid: IRoom['_id']): string | undefined => {
	const room = Rooms.state.get(rid);

	if (!room || room.t !== 'd' || !room.uids || room.uids.length > 2) {
		return undefined;
	}

	return room.uids.filter((_uid) => _uid !== accounts.getUserId())[0];
};
