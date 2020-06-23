import { RoomEvents } from '../../../../models/server';
import { HandlerMethod } from '../../../definitions/HandlerMethod';
import { IEventDataUpdate } from '../../../definitions/data/IEventDataUpdate';
import { IEventDataEmpty } from '../../../definitions/data/IEventDataEmpty';

export const roomEditMessage: HandlerMethod<IEventDataUpdate<IEventDataEmpty>> = async (event) => {
	const eventResult = await RoomEvents.addRoomEvent(event);

	if (eventResult.success) {
		// Update the parent event
		await RoomEvents.updateRoomEventData(event, event.d);
	}

	return eventResult;
};
