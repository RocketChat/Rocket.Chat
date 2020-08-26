import { RoomEvents } from '../../../../models/server';
import { HandlerMethod } from '../../../definitions/HandlerMethod';
import { IRoomEventDataMessage } from '../../../definitions/room/data/IRoomEventDataMessage';

export const roomMessage: HandlerMethod<IRoomEventDataMessage> = async (event, counter: number) => {
	console.time(`[${ counter }] handler`);
	const eventResult = await RoomEvents.addRoomEvent(event, counter);
	console.timeEnd(`[${ counter }] handler`);

	return eventResult;
};
