import type { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures } from '@rocket.chat/homeserver';

export function message(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.message', async (data) => {
		console.log('Received Matrix message event:', {
			event_id: data.event_id,
			room_id: data.room_id,
			sender: data.sender,
			body: data.content.body
		});

		// await Message.receiveMessageFromFederation({
		// 	fromId: data.sender,
		// 	rid: data.room_id,
		// 	msg: data.content.body,
		// 	federation_event_id: data.event_id,
		// });
	});
}