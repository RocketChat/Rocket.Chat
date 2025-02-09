export class RoomNotFoundError extends Error {
	constructor(message?: string) {
		super(message ?? 'Room not found');
	}
}

export class ConcurrencyError extends Error {
	constructor(message?: string) {
		super(message ?? 'Operation is already in progress');
	}
}
