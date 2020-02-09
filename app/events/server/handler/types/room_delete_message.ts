import { RoomEvents } from '../../../../models/server';
import { IAddEventResult } from '../../../../models/server/models/Events';
import { IEDataMessage } from '../../../definitions/data/IEDataMessage';
import { IEvent } from '../../../definitions/IEvent';

module.exports = async <T extends IEDataMessage>(event: IEvent<T>): Promise<IAddEventResult> => {
	const eventResult = await RoomEvents.addRoomEvent(event);

	if (eventResult.success) {
		// Update the parent event
		await RoomEvents.flagRoomEventAsDeleted(event);
	}

	return eventResult;
};
