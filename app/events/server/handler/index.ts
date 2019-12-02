import { EDataDefinition, IEvent, EventTypeDescriptor } from '../../definitions/IEvent';
import { IAddEventResult } from '../../../models/server/models/Events';

export type TypesHandler = {
	[P in EventTypeDescriptor]?: <T extends EDataDefinition>(event: IEvent<T>) => Promise<IAddEventResult>;
}

const typesHandler: TypesHandler = {
	genesis: require('./types/genesis'), // GENESIS

	// Room
	msg: require('./types/room_message'), // ROOM_MESSAGE
	emsg: require('./types/room_edit_message'), // ROOM_EDIT_MESSAGE
};

export async function handleEvents<T extends EDataDefinition>(events: [IEvent<T>]) {
	for (const event of events) {
		// eslint-disable-next-line no-await-in-loop
		await typesHandler[event.t](event);
	}
}
