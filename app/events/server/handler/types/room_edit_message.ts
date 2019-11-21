import { IEvent } from '../../../definitions/IEvent';
import { RoomEvents } from '../../../../models/server';
import { AddEventResult } from '../../../../models/server/models/Events';
import { IEDataUpdate } from '../../../definitions/data/IEDataUpdate';
import { IEDataMessage } from '../../../definitions/data/IEDataMessage';

module.exports = async <T extends IEDataMessage>(event: IEvent<T>): Promise<AddEventResult> => {
	const eventResult = await RoomEvents.addRoomEvent(event);

	if (eventResult.success) {
		// Update the parent event
		await RoomEvents.updateRoomEventData(event, event.d as IEDataUpdate<T>);
	}

	return eventResult;
};
