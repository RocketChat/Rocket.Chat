import { RoomEvents } from '../../../../models/server';
import { IEvent } from '../../../definitions/IEvent';
import { IEDataMessage } from '../../../definitions/data/IEDataMessage';
import { AddEventResult } from '../../../../models/server/models/Events';

module.exports = async <T extends IEDataMessage>(event: IEvent<T>): Promise<AddEventResult> => {
	const eventResult = await RoomEvents.addRoomEvent(event);

	return eventResult;
};
