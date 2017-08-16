export class RocketletUsersConverter {
	constructor(converters) {
		this.converters = converters;
	}

	convertById(userId) {
		const user = RocketChat.models.Users.findOneById(userId);

		return {
			id: user._id
		};
	}
}
