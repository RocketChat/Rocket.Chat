import { EDataDefinition, IEvent, EventTypeDescriptor } from '../../definitions/IEvent';
import { room } from './types/room';
import { roomDelete } from './types/room_delete';
import { roomMessage } from './types/room_message';
import { roomEditMessage } from './types/room_edit_message';
import { roomDeleteMessage } from './types/room_delete_message';
import { HandlerMethod } from '../../definitions/HandlerMethod';
import { IEDataMessage } from '../../definitions/data/IEDataMessage';
import { IEDataRoom } from '../../definitions/data/IEDataRoom';
import { IEDataUpdate } from '../../definitions/data/IEDataUpdate';
import { IEDataEmpty } from '../../definitions/data/IDataEmpty';

export type TypesHandler = {
	[P in EventTypeDescriptor]: HandlerMethod<EDataDefinition>;
}

const typesHandler: TypesHandler = {
	// Room
	room: (event) => room(event as IEvent<IEDataRoom>),
	droom: (event) => roomDelete(event as IEvent<IEDataUpdate<IEDataEmpty>>),
	msg: (event) => roomMessage(event as IEvent<IEDataMessage>),
	emsg: (event) => roomEditMessage(event as IEvent<IEDataUpdate<IEDataEmpty>>),
	dmsg: (event) => roomDeleteMessage(event as IEvent<IEDataUpdate<IEDataEmpty>>),
};

export async function handleEvents<T extends EDataDefinition>(events: [IEvent<T>]) {
	for (const event of events) {
		// eslint-disable-next-line no-await-in-loop
		await typesHandler[event.t](event);
	}
}
