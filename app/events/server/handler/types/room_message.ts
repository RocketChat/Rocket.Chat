import { RoomEvents } from '../../../../models/server';
import { HandlerMethod } from '../../../definitions/HandlerMethod';
import { IEDataMessage } from '../../../definitions/data/IEDataMessage';

export const roomMessage: HandlerMethod<IEDataMessage> = async (event) => {
	const eventResult = await RoomEvents.addRoomEvent(event);

	return eventResult;
};
