export class RocketletUsersConverter {
	constructor(orch) {
		this.orch = orch;
	}

	convertById(userId) {
		const user = RocketChat.models.Users.findOneById(userId);

		return {
			id: user._id
		};
	}
}
