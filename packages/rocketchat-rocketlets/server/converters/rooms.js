export class RocketletRoomsConverter {
	constructor(converters) {
		this.converters = converters;
	}

	convertById(roomId) {
		const room = RocketChat.models.Rooms.findOneById(roomId);

		return {
			id: room._id
		};
	}
}
