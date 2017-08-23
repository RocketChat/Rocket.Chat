export class RocketletRoomsConverter {
	constructor(orch) {
		this.orch = orch;
	}

	convertById(roomId) {
		const room = RocketChat.models.Rooms.findOneById(roomId);

		return {
			id: room._id
		};
	}
}
