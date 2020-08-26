import { EventDataDefinition, IEvent, EventTypeDescriptor } from '../../definitions/IEvent';
import { room } from './types/room';
import { roomDelete } from './types/room_delete';
import { roomMessage } from './types/room_message';
import { roomEditMessage } from './types/room_edit_message';
import { roomDeleteMessage } from './types/room_delete_message';
import { HandlerMethod } from '../../definitions/HandlerMethod';
import { IRoomEventDataMessage } from '../../definitions/room/data/IRoomEventDataMessage';
import { IRoomEventDataRoom } from '../../definitions/room/data/IRoomEventDataRoom';
import { IEventDataUpdate } from '../../definitions/data/IEventDataUpdate';
import { IEventDataEmpty } from '../../definitions/data/IEventDataEmpty';

export type TypesHandler = {
	[P in EventTypeDescriptor]: HandlerMethod<EventDataDefinition>;
}

const typesHandler: TypesHandler = {
	// Room
	room: (event) => room(event as IEvent<IRoomEventDataRoom>),
	droom: (event) => roomDelete(event as IEvent<IEventDataUpdate<IEventDataEmpty>>),
	msg: (event, counter) => roomMessage(event as IEvent<IRoomEventDataMessage>, counter),
	emsg: (event) => roomEditMessage(event as IEvent<IEventDataUpdate<IEventDataEmpty>>),
	dmsg: (event) => roomDeleteMessage(event as IEvent<IEventDataUpdate<IEventDataEmpty>>),
};

export async function handleEvents<T extends EventDataDefinition>(events: [IEvent<T>], counter: number) {
	console.time(`[${ counter }] handleEventsLoop`);
	for (const event of events) {
		// eslint-disable-next-line no-await-in-loop
		await typesHandler[event.t](event, counter);
	}
	console.timeEnd(`[${ counter }] handleEventsLoop`);
}
