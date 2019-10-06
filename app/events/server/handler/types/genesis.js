import { contextDefinitions } from '../../../../models/server/models/Events';
import { RoomEvents, Rooms } from '../../../../models/server';
// import { normalizers } from '../../../../federation/server/normalizers';

module.exports = async (event) => {
	const eventContext = contextDefinitions.ROOM.getContext(event);

	let eventResult;

	switch (event.d.contextType) {
		case contextDefinitions.ROOM.type:
			eventResult = await RoomEvents.addEvent(eventContext, event);

			// If the event was successfully added, handle the event locally
			if (eventResult.success) {
				const { d: { room } } = event;

				// Check if room exists
				const persistedRoom = Rooms.findOne({ _id: room._id });

				if (persistedRoom) {
					// Update the federation
					Rooms.update({ _id: persistedRoom._id }, { $set: { federation: room.federation } });
				} else {
					// // Denormalize room
					// const denormalizedRoom = normalizers.denormalizeRoom(room);
					//
					// // Create the room
					// Rooms.insert(denormalizedRoom);
				}
			}
			break;
	}

	return eventResult;
};
