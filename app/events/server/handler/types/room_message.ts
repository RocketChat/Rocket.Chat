import { RoomEvents } from '../../../../models/server';
import { HandlerMethod } from '../../../definitions/HandlerMethod';
import { IEventDataMessage } from '../../../definitions/data/IEventDataMessage';

export const roomMessage: HandlerMethod<IEventDataMessage> = async (event) => {
	const eventResult = await RoomEvents.addRoomEvent(event);

	return eventResult;
};
