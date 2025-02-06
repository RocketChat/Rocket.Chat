class RoomNotFoundError extends Error {
	constructor(message?: string) {
		super(message ?? 'Room not found');
	}
}

export default RoomNotFoundError;
