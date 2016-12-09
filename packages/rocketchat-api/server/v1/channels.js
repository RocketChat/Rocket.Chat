//Returns the channel IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
function findChannelById(roomId) {
	if (!roomId || !roomId.trim()) {
		return RocketChat.API.v1.failure('The parameter "roomId" is required');
	}

	const room = RocketChat.models.Rooms.findOneById(roomId);

	if (!room || room.t !== 'c') {
		return RocketChat.API.v1.failure(`No channel found by the id of: ${roomId}`);
	}

	return room;
}

RocketChat.API.v1.addRoute('channels.addAll', { authRequired: true }, {
	post: function() {
		const findResult = findChannelById(this.bodyParams.roomId);

		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.archived) {
			return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is archived`);
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('addAllUserToRoom', findResult._id);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(e.name + ': ' + e.message);
		}

		return RocketChat.API.v1.success({
			channel: RocketChat.models.Rooms.findOneById(findResult._id)
		});
	}
});

RocketChat.API.v1.addRoute('channels.archive', { authRequired: true }, {
	post: function() {
		const findResult = findChannelById(this.bodyParams.roomId);

		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.archived) {
			return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is already archived`);
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('archiveRoom', findResult._id);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('channels.cleanHistory', { authRequired: true }, {
	post: function() {
		const findResult = findChannelById(this.bodyParams.roomId);

		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.archived) {
			return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is archived`);
		}

		if (!this.bodyParams.latest) {
			return RocketChat.API.v1.failure('Body parameter "latest" is required.');
		}

		if (!this.bodyParams.oldest) {
			return RocketChat.API.v1.failure('Body parameter "oldest" is required.');
		}

		const latest = new Date(this.bodyParams.latest);
		const oldest = new Date(this.bodyParams.oldest);

		let inclusive = false;
		if (typeof this.bodyParams.inclusive !== 'undefined') {
			inclusive = this.bodyParams.inclusive;
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('cleanChannelHistory', { roomId: findResult._id, latest, oldest, inclusive });
			});
		} catch (e) {
			return RocketChat.API.v1.failure(e.name + ': ' + e.message);
		}

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('channels.close', { authRequired: true }, {
	post: function() {
		const findResult = findChannelById(this.bodyParams.roomId);

		if (findResult.statusCode) {
			return findResult;
		}

		const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId);

		if (!sub) {
			return RocketChat.API.v1.failure(`The user/callee is not in the channel "${findResult.name}.`);
		}

		if (!sub.open) {
			return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is already closed to the sender`);
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('hideRoom', findResult._id);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('channels.create', { authRequired: true }, {
	post: function() {
		if (!RocketChat.authz.hasPermission(this.userId, 'create-p')) {
			return RocketChat.API.v1.unauthorized();
		}

		if (!this.bodyParams.name) {
			return RocketChat.API.v1.failure('Body param "name" is required');
		}

		if (this.bodyParams.members && !_.isArray(this.bodyParams.members)) {
			return RocketChat.API.v1.failure('Body param "members" must be an array if provided');
		}

		let readOnly = false;
		if (typeof this.bodyParams.readOnly !== 'undefined') {
			readOnly = this.bodyParams.readOnly;
		}

		let id = undefined;
		try {
			Meteor.runAsUser(this.userId, () => {
				id = Meteor.call('createChannel', this.bodyParams.name, this.bodyParams.members ? this.bodyParams.members : [], readOnly);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			channel: RocketChat.models.Rooms.findOneById(id.rid)
		});
	}
});

RocketChat.API.v1.addRoute('channels.history', { authRequired: true }, {
	get: function() {
		const findResult = findChannelById(this.queryParams.roomId);

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
				result = Meteor.call('getChannelHistory', { rid: findResult._id, latest: latestDate, oldest: oldestDate, inclusive, count, unreads });
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			messages: result.messages
		});
	}
});

RocketChat.API.v1.addRoute('channels.info', { authRequired: true }, {
	get: function() {
		const findResult = findChannelById(this.queryParams.roomId);

		if (findResult.statusCode) {
			return findResult;
		}

		return RocketChat.API.v1.success({
			channel: RocketChat.models.Rooms.findOneById(findResult._id)
		});
	}
});

RocketChat.API.v1.addRoute('channels.invite', { authRequired: true }, {
	post: function() {
		if (!this.bodyParams.userId || !this.bodyParams.userId.trim()) {
			return RocketChat.API.v1.failure('Body param "userId" is required');
		}

		const findResult = findChannelById(this.bodyParams.roomId);


		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.archived) {
			return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is archived`);
		}

		const user = RocketChat.models.Users.findOneById(this.bodyParams.userId);

		if (!user) {
			return RocketChat.API.v1.failure(`There is not a user with the id: ${this.bodyParams.userId}`);
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('addUserToRoom', { rid: findResult._id, username: user.username });
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			channel: RocketChat.models.Rooms.findOneById(findResult._id)
		});
	}
});

RocketChat.API.v1.addRoute('channels.kick', { authRequired: true }, {
	post: function() {
		if (!this.bodyParams.userId || !this.bodyParams.userId.trim()) {
			return RocketChat.API.v1.failure('Body param "userId" is required');
		}

		const findResult = findChannelById(this.bodyParams.roomId);


		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.archived) {
			return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is archived`);
		}

		const user = RocketChat.models.Users.findOneById(this.bodyParams.userId);

		if (!user) {
			return RocketChat.API.v1.failure(`There is not a user with the id: ${this.bodyParams.userId}`);
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('removeUserFromRoom', { rid: findResult._id, username: user.username });
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			channel: RocketChat.models.Rooms.findOneById(findResult._id)
		});
	}
});

RocketChat.API.v1.addRoute('channels.leave', { authRequired: true }, {
	post: function() {
		const findResult = findChannelById(this.bodyParams.roomId);


		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.archived) {
			return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is archived`);
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('leaveRoom', findResult._id);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			channel: RocketChat.models.Rooms.findOneById(findResult._id)
		});
	}
});

RocketChat.API.v1.addRoute('channels.list', { authRequired: true }, {
	get: function() {
		return RocketChat.API.v1.success({
			channels: RocketChat.models.Rooms.findByType('c').fetch()
		});
	}
});

RocketChat.API.v1.addRoute('channels.list.joined', { authRequired: true }, {
	get: function() {
		const roomIds = _.pluck(RocketChat.models.Subscriptions.findByTypeAndUserId('p', this.userId).fetch(), 'rid');
		return RocketChat.API.v1.success({
			channels: RocketChat.models.Rooms.findByIds(roomIds).fetch()
		});
	}
});

RocketChat.API.v1.addRoute('channels.open', { authRequired: true }, {
	post: function() {
		const findResult = findChannelById(this.bodyParams.roomId);

		if (findResult.statusCode) {
			return findResult;
		}

		const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId);

		if (!sub) {
			return RocketChat.API.v1.failure(`The user/callee is not in the channel "${findResult.name}".`);
		}

		if (sub.open) {
			return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is already open to the sender`);
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('openRoom', findResult._id);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('channels.rename', { authRequired: true }, {
	post: function() {
		if (!this.bodyParams.name || !this.bodyParams.name.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "name" is required');
		}

		const findResult = findChannelById(this.bodyParams.roomId);

		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.archived) {
			return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is archived`);
		}

		if (findResult.name === this.bodyParams.name) {
			return RocketChat.API.v1.failure('The channel name is the same as what it would be renamed to.');
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult._id, 'roomName', this.bodyParams.name);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			channel: RocketChat.models.Rooms.findOneById(findResult._id)
		});
	}
});

RocketChat.API.v1.addRoute('channels.setDescription', { authRequired: true }, {
	post: function() {
		if (!this.bodyParams.description || !this.bodyParams.description.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "description" is required');
		}

		const findResult = findChannelById(this.bodyParams.roomId);

		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.archived) {
			return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is archived`);
		}

		if (findResult.description === this.bodyParams.description) {
			return RocketChat.API.v1.failure('The channel description is the same as what it would be changed to.');
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult._id, 'roomDescription', this.bodyParams.description);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			description: this.bodyParams.description
		});
	}
});

RocketChat.API.v1.addRoute('channels.setPurpose', { authRequired: true }, {
	post: function() {
		if (!this.bodyParams.purpose || !this.bodyParams.purpose.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "purpose" is required');
		}

		const findResult = findChannelById(this.bodyParams.roomId);


		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.archived) {
			return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is archived`);
		}

		if (findResult.description === this.bodyParams.purpose) {
			return RocketChat.API.v1.failure('The channel purpose (description) is the same as what it would be changed to.');
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult._id, 'roomDescription', this.bodyParams.purpose);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			purpose: this.bodyParams.purpose
		});
	}
});

RocketChat.API.v1.addRoute('channels.setTopic', { authRequired: true }, {
	post: function() {
		if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "topic" is required');
		}

		const findResult = findChannelById(this.bodyParams.roomId);


		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.archived) {
			return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is archived`);
		}

		if (findResult.topic === this.bodyParams.topic) {
			return RocketChat.API.v1.failure('The channel topic is the same as what it would be changed to.');
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult._id, 'roomTopic', this.bodyParams.topic);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			topic: this.bodyParams.topic
		});
	}
});

RocketChat.API.v1.addRoute('channels.unarchive', { authRequired: true }, {
	post: function() {
		const findResult = findChannelById(this.bodyParams.roomId);

		if (findResult.statusCode) {
			return findResult;
		}

		if (!findResult.archived) {
			return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is not archived`);
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('unarchiveRoom', findResult._id);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success();
	}
});
