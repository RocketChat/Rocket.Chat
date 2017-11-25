RocketChat.API.v1.addRoute('rooms.get', { authRequired: true }, {
	get: {
		//This is defined as such only to provide an example of how the routes can be defined :X
		action() {
			let updatedAt;

			if (typeof this.queryParams.updatedAt === 'string') {
				try {
					updatedAt = new Date(this.queryParams.updatedAt);

					if (updatedAt.toString() === 'Invalid Date') {
						return RocketChat.API.v1.failure('Invalid date for `updatedAt`');
					}
				} catch (error) {
					return RocketChat.API.v1.failure('Invalid date for `updatedAt`');
				}
			}

			return Meteor.runAsUser(this.userId, () => {
				return RocketChat.API.v1.success(Meteor.call('rooms/get', updatedAt));
			});
		}
	}
});
