import { RoomEvents } from '../../../../models/server';
import { HandlerMethod } from '../../../definitions/HandlerMethod';
import { IRoomEventDataMessage } from '../../../definitions/room/data/IRoomEventDataMessage';

export const roomMessage: HandlerMethod<IRoomEventDataMessage> = async (event) => {
	const eventResult = await RoomEvents.addRoomEvent(event);

	return eventResult;
};
