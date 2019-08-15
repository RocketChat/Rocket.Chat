import { FederationRoomEvents, FederationRoomEventsB } from '../../../models/server';
import { requestEvent } from './requestEvent';

export const serverStatus = {
	'server-a': true,
	'server-b': true,
};

export async function receiveEvent(server, event) {
	if (!serverStatus[server]) { return; }

	console.log(`Received event ${ event._id } on ${ server }`);

	let success;
	let missingIds;

	// Check if we have the parent of the received event
	switch (server) {
		case 'server-a': {
			const result = await FederationRoomEvents.addEvent(event.context, event);
			success = result.success;
			missingIds = result.missingIds;
			break;
		}
		case 'server-b': {
			const result = await FederationRoomEventsB.addEvent(event.context, event);
			success = result.success;
			missingIds = result.missingIds;
			break;
		}
	}

	if (!success) {
		console.log(`Missing parent ids ${ missingIds } for event ${ event._id }. requesting...`);

		missingIds.forEach(async (missingId) => {
			const parentEvent = await requestEvent(event.origin, event.context, missingId);

			if (!parentEvent) {
				console.log(`Could not get parent event for ${ event._id }.`);
				return;
			}

			await receiveEvent(server, parentEvent);

			await receiveEvent(server, event);
		});
	}
}

export async function initializeRoom(roomId) {
	console.log(`Initializing room ${ roomId }`);

	await FederationRoomEvents.ensureGenesisEvent('server-a', roomId);
}
