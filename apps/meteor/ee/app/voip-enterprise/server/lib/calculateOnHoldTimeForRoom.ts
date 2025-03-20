import type { IVoipRoom } from '@rocket.chat/core-typings';
import { PbxEvents } from '@rocket.chat/models';

export const calculateOnHoldTimeForRoom = async (room: IVoipRoom, closedAt: Date): Promise<number> => {
	if (!room.callUniqueId) {
		return 0;
	}

	const events = await PbxEvents.findByEvents(room.callUniqueId, ['Hold', 'Unhold']).toArray();
	if (!events.length) {
		// if there's no events, that means no hold time
		return 0;
	}

	if (events.length === 1 && events[0].event === 'Unhold') {
		// if the only event is an unhold event, something bad happened
		return 0;
	}

	if (events.length === 1 && events[0].event === 'Hold') {
		// if the only event is a hold event, the call was ended while on hold
		// hold time = room.closedAt - event.ts
		return closedAt.getTime() - events[0].ts.getTime();
	}

	let currentOnHoldTime = 0;

	for (let i = 0; i < events.length; i += 2) {
		const onHold = events[i].ts;
		const unHold = events[i + 1]?.ts || closedAt;

		currentOnHoldTime += unHold.getTime() - onHold.getTime();
	}

	return currentOnHoldTime;
};
