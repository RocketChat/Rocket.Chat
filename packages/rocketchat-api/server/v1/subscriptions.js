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

RocketChat.API.v1.addRoute('subscriptions.getOne', { authRequired: true }, {
	get() {
		const { roomId } = this.requestParams();

		if (!roomId) {
			return RocketChat.API.v1.failure('The \'roomId\' param is required');
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId, {
			fields: {
				_room: 0,
				_user: 0,
				$loki: 0
			}
		});

		return RocketChat.API.v1.success({
			subscription
		});
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

