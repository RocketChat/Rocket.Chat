import { serverAConnected, serverBConnected } from './receiveEvent';
import { FederationRoomEvents, FederationRoomEventsB } from '../../../models/server';

export async function requestEvent(server, contextQuery, eventId) {
	if (server === 'server-a' && !serverAConnected) { return; }
	if (server === 'server-b' && !serverBConnected) { return; }

	console.log(`Requesting event ${ eventId } to ${ server }`);

	let success;
	let event;

	// Check if we have the parent of the received event
	switch (server) {
		case 'server-a': {
			const result = await FederationRoomEvents.getEventById(contextQuery, eventId);
			success = result.success;
			event = result.event;
			break;
		}
		case 'server-b': {
			const result = await FederationRoomEventsB.getEventById(contextQuery, eventId);
			success = result.success;
			event = result.event;
			break;
		}
	}

	if (!success) {
		console.log('Could not find missing id', contextQuery, eventId);
	}

	return event;
}
