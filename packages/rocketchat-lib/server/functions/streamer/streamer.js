import { Meteor } from 'meteor/meteor';

export const Streamer = new class Streamer {
	broadcast(stream, eventName, ...args) {
		Meteor.StreamerCentral.emit('broadcast', stream, eventName, args); // TODO: remove that emiter
		// RocketChat.Services.broadcast('stream', { stream, eventName, args });
	}
	// internal(stream, eventName, ...args) {
	// RocketChat.Services.broadcast('stream-internal', { stream, eventName, args });
	// }
};
