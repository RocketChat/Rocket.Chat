import { RoomEvents } from '../../../../models/server';
import { HandlerMethod } from '../../../definitions/HandlerMethod';
import { IEDataUpdate } from '../../../definitions/data/IEDataUpdate';
import { IEDataEmpty } from '../../../definitions/data/IDataEmpty';

export const roomDeleteMessage: HandlerMethod<IEDataUpdate<IEDataEmpty>> = async (event) => {
	const eventResult = await RoomEvents.addRoomEvent(event);

	if (eventResult.success) {
		// Update the parent event
		await RoomEvents.flagRoomEventAsDeleted(event);
	}

	return eventResult;
};
