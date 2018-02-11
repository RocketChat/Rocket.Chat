import _ from 'underscore';

function findDirectMessageRoom(params, user) {
	if ((!params.roomId || !params.roomId.trim()) && (!params.username || !params.username.trim())) {
		throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" or "username" is required');
	}

	const room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
		currentUserId: user._id,
		nameOrId: params.username || params.roomId,
		type: 'd'
	});

	if (!room || room.t !== 'd') {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "username" param provided does not match any dirct message');
	}

	const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);

	return {
		room,
		subscription
	};
}

RocketChat.API.v1.addRoute(['dm.create', 'im.create'], { authRequired: true }, {
	post() {
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);

		return RocketChat.API.v1.success({
			room: findResult.room
		});
	}
});

RocketChat.API.v1.addRoute(['dm.close', 'im.close'], { authRequired: true }, {
	post() {
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);

		if (!findResult.subscription.open) {
			return RocketChat.API.v1.failure(`The direct message room, ${ this.bodyParams.name }, is already closed to the sender`);
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('hideRoom', findResult.room._id);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute(['dm.counters', 'im.counters'], { authRequired: true }, {
	get() {
		const access = RocketChat.authz.hasPermission(this.userId, 'view-room-administration');		
		const ruserId = this.requestParams().userId;
		let user = this.userId;
		let unreads = null;
		let userMentions = null;
		let unreadsFrom = null;
		let joined = false;
		let msgs = null;
		let latest = null;
		let members = null;
		
		if(ruserId) {
			if (!access) {
				return RocketChat.API.v1.unauthorized();
			}
			user = ruserId;
		}
		const rs = findDirectMessageRoom(this.requestParams(), { '_id': user} );
		const room = rs.room;
		const dm = rs.subscription;
		
		if(typeof dm !== 'undefined' && dm.open) {
			unreads = dm.unread;
			userMentions = dm.userMentions; 
			unreadsFrom = dm.ls;
			joined = true;
		}
		
		if(access || joined) {
			msgs = room.msgs;
			latest = room.lm;
			members = room.usernames.length; 
		}

		return RocketChat.API.v1.success({
			joined: joined,
			members: members,
			unreads: unreads,
			unreadsFrom: unreadsFrom,
			msgs: msgs,
			latest: latest,
			userMentions: userMentions
		});
	}
});

RocketChat.API.v1.addRoute(['dm.files', 'im.files'], { authRequired: true }, {
	get() {
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const ourQuery = Object.assign({}, query, { rid: findResult.room._id });

		const files = RocketChat.models.Uploads.find(ourQuery, {
			sort: sort ? sort : { name: 1 },
			skip: offset,
			limit: count,
			fields
		}).fetch();

		return RocketChat.API.v1.success({
			files,
			count: files.length,
			offset,
			total: RocketChat.models.Uploads.find(ourQuery).count()
		});
	}
});

RocketChat.API.v1.addRoute(['dm.history', 'im.history'], { authRequired: true }, {
	get() {
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);

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
			result = Meteor.call('getChannelHistory', {
				rid: findResult.room._id,
				latest: latestDate,
				oldest: oldestDate,
				inclusive,
				count,
				unreads
			});
		});

		if (!result) {
			return RocketChat.API.v1.unauthorized();
		}

		return RocketChat.API.v1.success(result);
	}
});

RocketChat.API.v1.addRoute(['dm.members', 'im.members'], { authRequired: true }, {
	get() {
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);

		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();

		const members = RocketChat.models.Rooms.processQueryOptionsOnResult(Array.from(findResult.room.usernames), {
			sort: sort ? sort : -1,
			skip: offset,
			limit: count
		});

		const users = RocketChat.models.Users.find({ username: { $in: members } },
			{ fields: { _id: 1, username: 1, name: 1, status: 1, utcOffset: 1 } }).fetch();

		return RocketChat.API.v1.success({
			members: users,
			count: members.length,
			offset,
			total: findResult.room.usernames.length
		});
	}
});

RocketChat.API.v1.addRoute(['dm.messages', 'im.messages'], { authRequired: true }, {
	get() {
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		console.log(findResult);
		const ourQuery = Object.assign({}, query, { rid: findResult.room._id });

		const messages = RocketChat.models.Messages.find(ourQuery, {
			sort: sort ? sort : { ts: -1 },
			skip: offset,
			limit: count,
			fields
		}).fetch();

		return RocketChat.API.v1.success({
			messages,
			count: messages.length,
			offset,
			total: RocketChat.models.Messages.find(ourQuery).count()
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
			fields
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
			fields
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
			fields
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
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);

		if (!findResult.subscription.open) {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('openRoom', findResult.room._id);
			});
		}

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute(['dm.setTopic', 'im.setTopic'], { authRequired: true }, {
	post() {
		if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "topic" is required');
		}

		const findResult = findDirectMessageRoom(this.requestParams(), this.user);

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('saveRoomSettings', findResult.room._id, 'roomTopic', this.bodyParams.topic);
		});

		return RocketChat.API.v1.success({
			topic: this.bodyParams.topic
		});
	}
});
