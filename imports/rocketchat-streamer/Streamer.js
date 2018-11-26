export const Streamer = new class Streamer {
	broadcast(stream, eventName, ...args) {
		RocketChat.Services.broadcast('stream', { stream, eventName, args });
	}
	internal(stream, eventName, ...args) {
		RocketChat.Services.broadcast('stream-internal', { stream, eventName, args });
	}
};
