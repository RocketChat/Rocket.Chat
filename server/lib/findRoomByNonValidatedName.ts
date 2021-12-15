import s from 'underscore.string';

import { getValidRoomName } from '../../app/utils/lib/getValidRoomName';
import { Rooms } from '../../app/models/server';
import type { IRoom } from '../../definition/IRoom';

export const findRoomByNonValidatedName = function(name: string): IRoom | undefined {
	const room = Rooms.findOneByName(name);
	if (room) {
		return room;
	}

	let channelName = s.trim(name);
	try {
		// TODO evaluate if this function call should be here
		channelName = getValidRoomName(channelName, undefined, { allowDuplicates: true });
	} catch (e) {
		console.error(e);
	}

	return Rooms.findOneByName(channelName);
};
