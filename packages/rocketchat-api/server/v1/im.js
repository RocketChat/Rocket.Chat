function findDirectMessageRoomById(roomId, userId) {
	if (!roomId || !roomId.trim()) {
		return RocketChat.API.v1.failure('Body param "roomId" is required');
	}

	const roomSub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, userId);

	if (!roomSub || roomSub.t !== 'd') {
		return RocketChat.API.v1.failure(`No direct message room found by the id of: ${ roomId }`);
	}

	return roomSub;
}

RocketChat.API.v1.addRoute(['dm.close', 'im.close'], { authRequired: true }, {
	post() {
		const findResult = findDirectMessageRoomById(this.bodyParams.roomId, this.userId);

		//The find method returns either with the dm or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		if (!findResult.open) {
			return RocketChat.API.v1.failure(`The direct message room, ${ this.bodyParams.name }, is already closed to the sender`);
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('hideRoom', findResult.rid);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute(['dm.history', 'im.history'], { authRequired: true }, {
	get() {
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

		let result;
		Meteor.runAsUser(this.userId, () => {
			result = Meteor.call('getChannelHistory', { rid: findResult.rid, latest: latestDate, oldest: oldestDate, inclusive, count, unreads });
		});

		return RocketChat.API.v1.success({
			messages: result && result.messages ? result.messages : []
		});
	}
});

RocketChat.API.v1.addRoute(['dm.messages.others', 'im.messages.others'], { authRequired: true }, {
	get() {
		if (RocketChat.settings.get('API_Enable_Direct_Message_History_EndPoint') !== true) {
			throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', { route: '/api/v1/im.messages.others' });
		}

		if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
			return RocketChat.API.v1.unauthorized();
		}

		const roomId = this.queryParams.roomId;
		if (!roomId || !roomId.trim()) {
			throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" is required');
		}

		const room = RocketChat.models.Rooms.findOneById(roomId);
		if (!room || room.t !== 'd') {
			throw new Meteor.Error('error-room-not-found', `No direct message room found by the id of: ${ roomId }`);
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();
		const ourQuery = Object.assign({}, query, { rid: room._id });

		const msgs = RocketChat.models.Messages.find(ourQuery, {
			sort: sort ? sort : { ts: -1 },
			skip: offset,
			limit: count,
			fields: Object.assign({}, fields, RocketChat.API.v1.defaultFieldsToExclude)
		}).fetch();

		return RocketChat.API.v1.success({
			messages: msgs,
			offset,
			count: msgs.length,
			total: RocketChat.models.Messages.find(ourQuery).count()
		});
	}
});

RocketChat.API.v1.addRoute(['dm.list', 'im.list'], { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, fields } = this.parseJsonQuery();
		let rooms = _.pluck(RocketChat.models.Subscriptions.findByTypeAndUserId('d', this.userId).fetch(), '_room');
		const totalCount = rooms.length;

		rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
			sort: sort ? sort : { name: 1 },
			skip: offset,
			limit: count,
			fields: Object.assign({}, fields, RocketChat.API.v1.defaultFieldsToExclude)
		});

		return RocketChat.API.v1.success({
			ims: rooms,
			offset,
			count: rooms.length,
			total: totalCount
		});
	}
});

RocketChat.API.v1.addRoute(['dm.list.everyone', 'im.list.everyone'], { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
			return RocketChat.API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const ourQuery = Object.assign({}, query, { t: 'd' });

		const rooms = RocketChat.models.Rooms.find(ourQuery, {
			sort: sort ? sort : { name: 1 },
			skip: offset,
			limit: count,
			fields: Object.assign({}, fields, RocketChat.API.v1.defaultFieldsToExclude)
		}).fetch();

		return RocketChat.API.v1.success({
			ims: rooms,
			offset,
			count: rooms.length,
			total: RocketChat.models.Rooms.find(ourQuery).count()
		});
	}
});

RocketChat.API.v1.addRoute(['dm.open', 'im.open'], { authRequired: true }, {
	post() {
		const findResult = findDirectMessageRoomById(this.bodyParams.roomId, this.userId);

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.open) {
			return RocketChat.API.v1.failure(`The direct message room, ${ this.bodyParams.name }, is already open for the sender`);
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('openRoom', findResult.rid);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute(['dm.setTopic', 'im.setTopic'], { authRequired: true }, {
	post() {
		if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "topic" is required');
		}

		const findResult = findDirectMessageRoomById(this.bodyParams.roomId, this.userId);

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('saveRoomSettings', findResult.rid, 'roomTopic', this.bodyParams.topic);
		});

		return RocketChat.API.v1.success({
			topic: this.bodyParams.topic
		});
	}
});
