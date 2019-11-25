import { EDataDefinition, IEvent } from '../../definitions/IEvent';

const typesHandler = {
	genesis: require('./types/genesis'), // GENESIS

	// Room
	msg: require('./types/room_message'), // ROOM_MESSAGE
	emsg: require('./types/room_edit_message'), // ROOM_EDIT_MESSAGE
};

export async function handleEvents<T extends EDataDefinition>(events: [IEvent<T>]) {
	for (const event of events) {
		// /* eslint-disable no-await-in-loop */
		await typesHandler[event.t](event);
		// /* eslint-enable no-await-in-loop */
	}
}
