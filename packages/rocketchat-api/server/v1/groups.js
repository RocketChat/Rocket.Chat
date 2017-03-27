//Returns the private group subscription IF found otherwise it will reutrn the failure of why it didn't. Check the `statusCode` property
function findPrivateGroupByIdOrName({ roomId, roomName, userId, checkedArchived = true }) {
	if ((!roomId || !roomId.trim()) && (!roomName || !roomName.trim())) {
		throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" or "roomName" is required');
	}

	let roomSub;
	if (roomId) {
		roomSub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, userId);
	} else if (roomName) {
		roomSub = RocketChat.models.Subscriptions.findOneByRoomNameAndUserId(roomName, userId);
	}

	if (!roomSub || roomSub.t !== 'p') {
		throw new Meteor.Error('error-room-not-found', `No private group by the id of: ${ roomId }`);
	}

	if (checkedArchived && roomSub.archived) {
		throw new Meteor.Error('error-room-archived', `The private group, ${ roomSub.name }, is archived`);
	}

	return roomSub;
}

RocketChat.API.v1.addRoute('groups.addModerator', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId });

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('addRoomModerator', findResult.rid, user._id);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.addOwner', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId });

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('addRoomOwner', findResult.rid, user._id);
		});

		return RocketChat.API.v1.success();
	}
});

//Archives a private group only if it wasn't
RocketChat.API.v1.addRoute('groups.archive', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId });

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('archiveRoom', findResult.rid);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.close', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId, checkedArchived: false });

		if (!findResult.open) {
			return RocketChat.API.v1.failure(`The private group with an id "${ this.bodyParams.roomId }" is already closed to the sender`);
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('hideRoom', findResult.rid);
		});

		return RocketChat.API.v1.success();
	}
});

//Create Private Group
RocketChat.API.v1.addRoute('groups.create', { authRequired: true }, {
	post() {
		if (!RocketChat.authz.hasPermission(this.userId, 'create-p')) {
			return RocketChat.API.v1.unauthorized();
		}

		if (!this.bodyParams.name) {
			return RocketChat.API.v1.failure('Body param "name" is required');
		}

		if (this.bodyParams.members && !_.isArray(this.bodyParams.members)) {
			return RocketChat.API.v1.failure('Body param "members" must be an array if provided');
		}

		if (this.bodyParams.customFields && !(typeof this.bodyParams.customFields === 'object')) {
			return RocketChat.API.v1.failure('Body param "customFields" must be an object if provided');
		}

		let readOnly = false;
		if (typeof this.bodyParams.readOnly !== 'undefined') {
			readOnly = this.bodyParams.readOnly;
		}

		let id;
		Meteor.runAsUser(this.userId, () => {
			id = Meteor.call('createPrivateGroup', this.bodyParams.name, this.bodyParams.members ? this.bodyParams.members : [], readOnly, this.bodyParams.customFields);
		});

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.findOneById(id.rid, { fields: RocketChat.API.v1.defaultFieldsToExclude })
		});
	}
});

RocketChat.API.v1.addRoute('groups.delete', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId, checkedArchived: false });

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('eraseRoom', findResult.rid);
		});

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.processQueryOptionsOnResult([findResult._room], { fields: RocketChat.API.v1.defaultFieldsToExclude })[0]
		});
	}
});

RocketChat.API.v1.addRoute('groups.getIntegrations', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
			return RocketChat.API.v1.unauthorized();
		}

		const findResult = findPrivateGroupByIdOrName({ roomId: this.queryParams.roomId, userId: this.userId, checkedArchived: false });

		let includeAllPrivateGroups = true;
		if (typeof this.queryParams.includeAllPrivateGroups !== 'undefined') {
			includeAllPrivateGroups = this.queryParams.includeAllPrivateGroups === 'true';
		}

		const channelsToSearch = [`#${ findResult.name }`];
		if (includeAllPrivateGroups) {
			channelsToSearch.push('all_private_groups');
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const ourQuery = Object.assign({}, query, { channel: { $in: channelsToSearch } });
		const integrations = RocketChat.models.Integrations.find(ourQuery, {
			sort: sort ? sort : { _createdAt: 1 },
			skip: offset,
			limit: count,
			fields: Object.assign({}, fields, RocketChat.API.v1.defaultFieldsToExclude)
		}).fetch();

		return RocketChat.API.v1.success({
			integrations,
			count: integrations.length,
			offset,
			total: RocketChat.models.Integrations.find(ourQuery).count()
		});
	}
});

RocketChat.API.v1.addRoute('groups.history', { authRequired: true }, {
	get() {
		const findResult = findPrivateGroupByIdOrName({ roomId: this.queryParams.roomId, userId: this.userId, checkedArchived: false });

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

RocketChat.API.v1.addRoute('groups.info', { authRequired: true }, {
	get() {
		const findResult = findPrivateGroupByIdOrName({ roomId: this.queryParams.roomId, roomName: this.queryParams.roomName, userId: this.userId, checkedArchived: false });

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.findOneById(findResult.rid, { fields: RocketChat.API.v1.defaultFieldsToExclude })
		});
	}
});

RocketChat.API.v1.addRoute('groups.invite', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId });

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('addUserToRoom', { rid: findResult.rid, username: user.username });
		});

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.findOneById(findResult.rid, { fields: RocketChat.API.v1.defaultFieldsToExclude })
		});
	}
});

RocketChat.API.v1.addRoute('groups.kick', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId });

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('removeUserFromRoom', { rid: findResult.rid, username: user.username });
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.leave', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId });

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('leaveRoom', findResult.rid);
		});

		return RocketChat.API.v1.success();
	}
});

//List Private Groups a user has access to
RocketChat.API.v1.addRoute('groups.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, fields } = this.parseJsonQuery();
		let rooms = _.pluck(RocketChat.models.Subscriptions.findByTypeAndUserId('p', this.userId).fetch(), '_room');
		const totalCount = rooms.length;

		rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
			sort: sort ? sort : { name: 1 },
			skip: offset,
			limit: count,
			fields: Object.assign({}, fields, RocketChat.API.v1.defaultFieldsToExclude)
		});

		return RocketChat.API.v1.success({
			groups: rooms,
			offset,
			count: rooms.length,
			total: totalCount
		});
	}
});

RocketChat.API.v1.addRoute('groups.online', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		const ourQuery = Object.assign({}, query, { t: 'p' });

		const room = RocketChat.models.Rooms.findOne(ourQuery);

		if (room == null) {
			return RocketChat.API.v1.failure('Group does not exists');
		}

		const online = RocketChat.models.Users.findUsersNotOffline({
			fields: {
				username: 1
			}
		}).fetch();

		const onlineInRoom = [];
		online.forEach(user => {
			if (room.usernames.indexOf(user.username) !== -1) {
				onlineInRoom.push({
					_id: user._id,
					username: user.username
				});
			}
		});

		return RocketChat.API.v1.success({
			online: onlineInRoom
		});
	}
});

RocketChat.API.v1.addRoute('groups.open', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId, checkedArchived: false });

		if (findResult.open) {
			return RocketChat.API.v1.failure(`The private group, ${ this.bodyParams.name }, is already open for the sender`);
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('openRoom', findResult.rid);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.removeModerator', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId });

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('removeRoomModerator', findResult.rid, user._id);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.removeOwner', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId });

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('removeRoomOwner', findResult.rid, user._id);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.rename', { authRequired: true }, {
	post() {
		if (!this.bodyParams.name || !this.bodyParams.name.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "name" is required');
		}

		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId });

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('saveRoomSettings', findResult.rid, 'roomName', this.bodyParams.name);
		});

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.findOneById(findResult.rid, { fields: RocketChat.API.v1.defaultFieldsToExclude })
		});
	}
});

RocketChat.API.v1.addRoute('groups.setDescription', { authRequired: true }, {
	post() {
		if (!this.bodyParams.description || !this.bodyParams.description.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "description" is required');
		}

		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId });

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.description);
		});

		return RocketChat.API.v1.success({
			description: this.bodyParams.description
		});
	}
});

RocketChat.API.v1.addRoute('groups.setPurpose', { authRequired: true }, {
	post() {
		if (!this.bodyParams.purpose || !this.bodyParams.purpose.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "purpose" is required');
		}

		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId });

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.purpose);
		});

		return RocketChat.API.v1.success({
			purpose: this.bodyParams.purpose
		});
	}
});

RocketChat.API.v1.addRoute('groups.setReadOnly', { authRequired: true }, {
	post() {
		if (typeof this.bodyParams.readOnly === 'undefined') {
			return RocketChat.API.v1.failure('The bodyParam "readOnly" is required');
		}

		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId });

		if (findResult.ro === this.bodyParams.readOnly) {
			return RocketChat.API.v1.failure('The private group read only setting is the same as what it would be changed to.');
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('saveRoomSettings', findResult.rid, 'readOnly', this.bodyParams.readOnly);
		});

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.findOneById(findResult.rid, { fields: RocketChat.API.v1.defaultFieldsToExclude })
		});
	}
});

RocketChat.API.v1.addRoute('groups.setTopic', { authRequired: true }, {
	post() {
		if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "topic" is required');
		}

		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId });

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('saveRoomSettings', findResult.rid, 'roomTopic', this.bodyParams.topic);
		});

		return RocketChat.API.v1.success({
			topic: this.bodyParams.topic
		});
	}
});

RocketChat.API.v1.addRoute('groups.setType', { authRequired: true }, {
	post() {
		if (!this.bodyParams.type || !this.bodyParams.type.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "type" is required');
		}

		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId });

		if (findResult.t === this.bodyParams.type) {
			return RocketChat.API.v1.failure('The private group type is the same as what it would be changed to.');
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('saveRoomSettings', findResult.rid, 'roomType', this.bodyParams.type);
		});

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.findOneById(findResult.rid, { fields: RocketChat.API.v1.defaultFieldsToExclude })
		});
	}
});

RocketChat.API.v1.addRoute('groups.unarchive', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ roomId: this.bodyParams.roomId, userId: this.userId, checkedArchived: false });

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('unarchiveRoom', findResult.rid);
		});

		return RocketChat.API.v1.success();
	}
});
