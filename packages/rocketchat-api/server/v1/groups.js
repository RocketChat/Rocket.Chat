//Returns the private group subscription IF found otherwise it will reutrn the failure of why it didn't. Check the `statusCode` property
function findPrivateGroupById({ roomId, userId, checkedArchived = true }) {
	if (!roomId || !roomId.trim()) {
		return RocketChat.API.v1.failure('Body param "roomId" is required');
	}

	const roomSub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, userId);

	if (!roomSub || roomSub.t !== 'p') {
		return RocketChat.API.v1.failure(`No private group found by the id of: ${roomId}`);
	}

	if (checkedArchived && roomSub.archived) {
		return RocketChat.API.v1.failure(`The private group, ${roomSub.name}, is already archived`);
	}

	return roomSub;
}

//Archives a private group only if it wasn't
RocketChat.API.v1.addRoute('groups.archive', { authRequired: true }, {
	post: function() {
		const findResult = findPrivateGroupById({ roomId: this.bodyParams.roomId, userId: this.userId });

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('archiveRoom', findResult.rid);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.close', { authRequired: true }, {
	post: function() {
		const findResult = findPrivateGroupById({ roomId: this.bodyParams.roomId, userId: this.userId, checkedArchived: false });

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		if (!findResult.open) {
			return RocketChat.API.v1.failure(`The private group with an id "${this.bodyParams.roomId}" is already closed to the sender`);
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

//Create Private Group
RocketChat.API.v1.addRoute('groups.create', { authRequired: true }, {
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

		let id = undefined;
		try {
			Meteor.runAsUser(this.userId, () => {
				id = Meteor.call('createPrivateGroup', this.bodyParams.name, this.bodyParams.members ? this.bodyParams.members : []);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.findOneById(id.rid, { fields: RocketChat.API.v1.roomFieldsToExclude })
		});
	}
});

RocketChat.API.v1.addRoute('groups.getIntegrations', { authRequired: true }, {
	get: function() {
		if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
			return RocketChat.API.v1.unauthorized();
		}

		const findResult = findPrivateGroupById({ roomId: this.queryParams.roomId, userId: this.userId, checkedArchived: false });

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		let includeAllPrivateGroups = true;
		if (typeof this.queryParams.includeAllPrivateGroups !== 'undefined') {
			includeAllPrivateGroups = this.queryParams.includeAllPrivateGroups === 'true';
		}

		const channelsToSearch = [`#${findResult.name}`];
		if (includeAllPrivateGroups) {
			channelsToSearch.push('all_private_groups');
		}

		return RocketChat.API.v1.success({
			integrations: RocketChat.models.Integrations.find({
				channel: {
					$in: channelsToSearch
				}
			}).fetch()
		});
	}
});

RocketChat.API.v1.addRoute('groups.history', { authRequired: true }, {
	get: function() {
		const findResult = findPrivateGroupById({ roomId: this.queryParams.roomId, userId: this.userId, checkedArchived: false });

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

RocketChat.API.v1.addRoute('groups.info', { authRequired: true }, {
	get: function() {
		const findResult = findPrivateGroupById({ roomId: this.queryParams.roomId, userId: this.userId, checkedArchived: false });

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.findOneById(findResult.rid, { fields: RocketChat.API.v1.roomFieldsToExclude })
		});
	}
});

RocketChat.API.v1.addRoute('groups.invite', { authRequired: true }, {
	post: function() {
		if (!this.bodyParams.userId || !this.bodyParams.userId.trim()) {
			return RocketChat.API.v1.failure('Body param "userId" is required');
		}

		const findResult = findPrivateGroupById({ roomId: this.bodyParams.roomId, userId: this.userId });

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		const user = RocketChat.models.Users.findOneById(this.bodyParams.userId);

		if (!user) {
			return RocketChat.API.v1.failure(`There is not a user with the id: ${this.bodyParams.userId}`);
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('addUserToRoom', { rid: findResult.rid, username: user.username });
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.findOneById(findResult.rid, { fields: RocketChat.API.v1.roomFieldsToExclude })
		});
	}
});

RocketChat.API.v1.addRoute('groups.kick', { authRequired: true }, {
	post: function() {
		if (!this.bodyParams.userId || !this.bodyParams.userId.trim()) {
			return RocketChat.API.v1.failure('Body param "userId" is required');
		}

		const findResult = findPrivateGroupById({ roomId: this.bodyParams.roomId, userId: this.userId });

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		const user = RocketChat.models.Users.findOneById(this.bodyParams.userId);

		if (!user) {
			return RocketChat.API.v1.failure(`There is not a user with the id: ${this.bodyParams.userId}`);
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('removeUserFromRoom', { rid: findResult.rid, username: user.username });
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.leave', { authRequired: true }, {
	post: function() {
		const findResult = findPrivateGroupById({ roomId: this.bodyParams.roomId, userId: this.userId });

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('leaveRoom', findResult.rid);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success();
	}
});

//List Private Groups a user has access to
RocketChat.API.v1.addRoute('groups.list', { authRequired: true }, {
	get: function() {
		const { offset, count } = RocketChat.API.v1.getPaginationItems(this);
		let rooms = _.pluck(RocketChat.models.Subscriptions.findByTypeAndUserId('p', this.userId).fetch(), '_room');
		const totalCount = rooms.length;

		rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
			sort: { msgs: -1 },
			skip: offset,
			limit: count,
			fields: RocketChat.API.v1.roomFieldsToExclude
		});

		return RocketChat.API.v1.success({
			groups: rooms,
			offset,
			count: rooms.length,
			total: totalCount
		});
	}
});

RocketChat.API.v1.addRoute('groups.open', { authRequired: true }, {
	post: function() {
		const findResult = findPrivateGroupById({ roomId: this.bodyParams.roomId, userId: this.userId, checkedArchived: false });

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.open) {
			return RocketChat.API.v1.failure(`The private group, ${this.bodyParams.name}, is already open for the sender`);
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

RocketChat.API.v1.addRoute('groups.rename', { authRequired: true }, {
	post: function() {
		if (!this.bodyParams.name || !this.bodyParams.name.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "name" is required');
		}

		const findResult = findPrivateGroupById({ roomId: this.bodyParams.roomId, userId: this.userId });

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult.rid, 'roomName', this.bodyParams.name);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			channel: RocketChat.models.Rooms.findOneById(findResult.rid, { fields: RocketChat.API.v1.roomFieldsToExclude })
		});
	}
});

RocketChat.API.v1.addRoute('groups.setDescription', { authRequired: true }, {
	post: function() {
		if (!this.bodyParams.description || !this.bodyParams.description.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "description" is required');
		}

		const findResult = findPrivateGroupById({ roomId: this.bodyParams.roomId, userId: this.userId });

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.description);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			description: this.bodyParams.description
		});
	}
});

RocketChat.API.v1.addRoute('groups.setPurpose', { authRequired: true }, {
	post: function() {
		if (!this.bodyParams.purpose || !this.bodyParams.purpose.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "purpose" is required');
		}

		const findResult = findPrivateGroupById({ roomId: this.bodyParams.roomId, userId: this.userId });

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.purpose);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			purpose: this.bodyParams.purpose
		});
	}
});

RocketChat.API.v1.addRoute('groups.setReadOnly', { authRequired: true }, {
	post: function() {
		if (typeof this.bodyParams.readOnly === 'undefined') {
			return RocketChat.API.v1.failure('The bodyParam "readOnly" is required');
		}

		const findResult = findPrivateGroupById({ roomId: this.bodyParams.roomId, userId: this.userId });

		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.ro === this.bodyParams.readOnly) {
			return RocketChat.API.v1.failure('The private group read only setting is the same as what it would be changed to.');
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult._id, 'readOnly', this.bodyParams.readOnly);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.findOneById(findResult._id, { fields: RocketChat.API.v1.roomFieldsToExclude })
		});
	}
});

RocketChat.API.v1.addRoute('groups.setTopic', { authRequired: true }, {
	post: function() {
		if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "topic" is required');
		}

		const findResult = findPrivateGroupById({ roomId: this.bodyParams.roomId, userId: this.userId });

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

RocketChat.API.v1.addRoute('groups.setType', { authRequired: true }, {
	post: function() {
		if (!this.bodyParams.type || !this.bodyParams.type.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "type" is required');
		}

		const findResult = findPrivateGroupById({ roomId: this.bodyParams.roomId, userId: this.userId });

		if (findResult.statusCode) {
			return findResult;
		}

		if (findResult.t === this.bodyParams.type) {
			return RocketChat.API.v1.failure('The private group type is the same as what it would be changed to.');
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult._id, 'roomType', this.bodyParams.type);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.findOneById(findResult._id, { fields: RocketChat.API.v1.roomFieldsToExclude })
		});
	}
});

RocketChat.API.v1.addRoute('groups.unarchive', { authRequired: true }, {
	post: function() {
		const findResult = findPrivateGroupById({ roomId: this.bodyParams.roomId, userId: this.userId });

		//The find method returns either with the group or the failure
		if (findResult.statusCode) {
			return findResult;
		}

		try {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('unarchiveRoom', findResult.rid);
			});
		} catch (e) {
			return RocketChat.API.v1.failure(`${e.name}: ${e.message}`);
		}

		return RocketChat.API.v1.success();
	}
});
