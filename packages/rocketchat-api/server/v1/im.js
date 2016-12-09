function findDirectMessageRoomById(roomId, userId) {
	if (!roomId || !roomId.trim()) {
		return RocketChat.API.v1.failure('Body param "roomId" is required');
	}

	const roomSub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, userId);

	if (!roomSub || roomSub.t !== 'd') {
		return RocketChat.API.v1.failure(`No direct message room found by the id of: ${roomId}`);
	}

	return roomSub;
}

RocketChat.API.v1.addRoute('im.close', { authRequired: true }, {
	post: function() {
		const findResult = findDirectMessageRoomById(this.bodyParams.roomId, this.userId);

		//The find method returns either with the dm or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		if (!findResult.open) {
			return RocketChat.API.v1.failure(`The direct message room, ${this.bodyParams.name}, is already closed to the sender`);
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('hideRoom', findResult.rid);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('im.history', { authRequired: true }, {
	get: function() {
		const findResult = findDirectMessageRoomById(this.queryParams.roomId, this.userId);

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		let latestDate = new Date();
		if (this.queryParams.latest) {
			latestDate = new Date(this.queryParams.latest);
		}

		let oldestDate = undefined;
		if (this.queryParams.oldest) {
			oldestDate = new Date(this.queryParams.oldest);
		}

		let inclusive = false;
		if (this.queryParams.inclusive) {
			inclusive = this.queryParams.inclusive;
		}

		let count = 20;
		if (this.queryParams.count) {
			count = parseInt(this.queryParams.count);
		}

		let unreads = false;
		if (this.queryParams.unreads) {
			unreads = this.queryParams.unreads;
		}

		let result = {};
		try {
			Meteor.runAsUser(this.userId, () => {
				result = Meteor.call('getChannelHistory', { rid: findResult.rid, latest: latestDate, oldest: oldestDate, inclusive, count, unreads });
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			messages: result.messages
		});
	}
});


RocketChat.API.v1.addRoute('im.list', { authRequired: true }, {
	get: function() {
		const roomIds = _.pluck(RocketChat.models.Subscriptions.findByTypeAndUserId('d', this.userId).fetch(), 'rid');
		return RocketChat.API.v1.success({
			ims: RocketChat.models.Rooms.findByIds(roomIds).fetch()
		});
	}
});

RocketChat.API.v1.addRoute('im.open', { authRequired: true }, {
	post: function() {
		const findResult = findDirectMessageRoomById(this.bodyParams.roomId, this.userId);

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.open) {
			return RocketChat.API.v1.failure(`The direct message room, ${this.bodyParams.name}, is already open for the sender`);
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('openRoom', findResult.rid);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success();
	}
});


RocketChat.API.v1.addRoute('im.setTopic', { authRequired: true }, {
	post: function() {
		if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "topic" is required');
		}

		const findResult = findDirectMessageRoomById(this.bodyParams.roomId, this.userId);

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult.rid, 'roomTopic', this.bodyParams.topic);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			topic: this.bodyParams.topic
		});
	}
});
