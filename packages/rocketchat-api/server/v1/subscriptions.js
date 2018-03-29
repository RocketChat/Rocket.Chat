RocketChat.API.v1.addRoute('subscriptions.get', { authRequired: true }, {
	get() {
		const { updatedSince } = this.queryParams;

		let updatedSinceDate;
		if (updatedSince) {
			if (isNaN(Date.parse(updatedSince))) {
				throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
			} else {
				updatedSinceDate = new Date(updatedSince);
			}
		}

		let result;
		Meteor.runAsUser(this.userId, () => result = Meteor.call('subscriptions/get', updatedSinceDate));

		if (Array.isArray(result)) {
			result = {
				update: result,
				remove: []
			};
		}

		return RocketChat.API.v1.success(result);
	}
});

/**
	This API is suppose to mark any room as read.

	Method: POST
	Route: api/v1/subscriptions.read
	Params:
		- rid: The rid of the room to be marked as read.
 */
RocketChat.API.v1.addRoute('subscriptions.read', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			rid: String
		});

		Meteor.runAsUser(this.userId, () =>
			Meteor.call('readMessages', this.bodyParams.rid)
		);

		return RocketChat.API.v1.success();
	}
});

