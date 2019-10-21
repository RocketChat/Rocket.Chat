import { RoomEvents } from '../../../../models/server';
import { contextDefinitions } from '../../../../models/server/models/Events';

const { ROOM: { context, contextQuery } } = contextDefinitions;

module.exports = async (event) => {
	const eventContext = contextQuery(context(event));

	const eventResult = await RoomEvents.addEvent(eventContext, event);

	// Update the parent event
	await RoomEvents.updateEventData(eventContext, event);

	return eventResult;
};
