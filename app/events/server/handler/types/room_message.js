import { RoomEvents } from '../../../../models/server';
import { contextDefinitions } from '../../../../models/server/models/Events';

const { ROOM: { context, contextQuery } } = contextDefinitions;

module.exports = async (event) => {
	const eventContext = contextQuery(context(event));

	const eventResult = await RoomEvents.addEvent(eventContext, event);

	// // If the event was successfully added, handle the event locally
	// if (eventResult.success) {
	// 	const { _id } = event;
	//
	// 	// Check if message exists
	// 	const persistedMessage = Messages.findOne({ _id });
	//
	// 	if (persistedMessage) {
	// 		// // Update the federation
	// 		// Messages.update({ _id }, { $set: { federation: message.federation } });
	// 	} else {
	// 		// // Update the subscription open status
	// 		// Subscriptions.update({ rid: message.rid, name: message.u.username }, { $set: { open: true, alert: true } });
	// 		//
	// 		// // Denormalize user
	// 		// const denormalizedMessage = normalizers.denormalizeMessage(message);
	// 		//
	// 		// // Create the message
	// 		// Messages.insert(denormalizedMessage);
	// 	}
	// }

	return eventResult;
};
