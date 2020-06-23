import { RoomEvents, Rooms } from '../../../../models/server';
import { HandlerMethod } from '../../../definitions/HandlerMethod';
import { IEventDataRoom } from '../../../definitions/data/IEventDataRoom';

export const room: HandlerMethod<IEventDataRoom> = async (event) => {
	const eventResult = await RoomEvents.addRoomEvent(event);

	// If the event was successfully added, handle the event locally
	if (eventResult.success) {
		const { d: { room } } = event;

		Rooms.upsert({ _id: room._id }, { $set: { federation: room.federation } });
	}

	return eventResult;
};
