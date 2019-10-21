const typesHandler = {
	genesis: require('./types/genesis'), // GENESIS

	// Room
	msg: require('./types/room_message'), // ROOM_MESSAGE
	emsg: require('./types/room_edit_message'), // ROOM_EDIT_MESSAGE
};

export async function handleEvents(events) {
	for (const event of events) {
		// eslint-disable-next-line no-await-in-loop
		await typesHandler[event.t](event);
	}
}
