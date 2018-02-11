import _ from 'underscore';

//Returns the private group subscription IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
function findPrivateGroupByIdOrName({ params, userId, checkedArchived = true }) {
	if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
		throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
	}

	let roomSub;
	if (params.roomId) {
		roomSub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(params.roomId, userId);
	} else if (params.roomName) {
		roomSub = RocketChat.models.Subscriptions.findOneByRoomNameAndUserId(params.roomName, userId);
	}

	if (!roomSub || roomSub.t !== 'p') {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
	}

	if (checkedArchived && roomSub.archived) {
		throw new Meteor.Error('error-room-archived', `The private group, ${ roomSub.name }, is archived`);
	}

	return roomSub;
}

RocketChat.API.v1.addRoute('groups.addAll', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('addAllUserToRoom', findResult.rid, this.bodyParams.activeUsersOnly);
		});

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.findOneById(findResult.rid, { fields: RocketChat.API.v1.defaultFieldsToExclude })
		});
	}
});

RocketChat.API.v1.addRoute('groups.addModerator', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('addRoomModerator', findResult.rid, user._id);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.addOwner', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('addRoomOwner', findResult.rid, user._id);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.addLeader', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });
		const user = this.getUserFromParams();
		Meteor.runAsUser(this.userId, () => {
			Meteor.call('addRoomLeader', findResult.rid, user._id);
		});

		return RocketChat.API.v1.success();
	}
});

//Archives a private group only if it wasn't
RocketChat.API.v1.addRoute('groups.archive', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('archiveRoom', findResult.rid);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.close', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId, checkedArchived: false });

		if (!findResult.open) {
			return RocketChat.API.v1.failure(`The private group, ${ findResult.name }, is already closed to the sender`);
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('hideRoom', findResult.rid);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.counters', { authRequired: true }, {
	get() {
		const access = RocketChat.authz.hasPermission(this.userId, 'view-room-administration');
		const params = this.requestParams();
		let user = this.userId;
		let room;
		let unreads = null;
		let userMentions = null;
		let unreadsFrom = null;
		let joined = false;

		if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
			throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
		}

		if (params.roomId) {
			room = RocketChat.models.Rooms.findOneById(params.roomId);
		} else if (params.roomName) {
			room = RocketChat.models.Rooms.findOneByName(params.roomName);
		}

		if (!room || room.t !== 'p') {
			throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
		}

		if (room.archived) {
			throw new Meteor.Error('error-room-archived', `The private group, ${ room.name }, is archived`);
		}

		if (params.userId) {
			if (!access) {
				return RocketChat.API.v1.unauthorized();
			}
			user = params.userId;
		}
		const group = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user);

		if (typeof group !== 'undefined' && group.open) {
			unreads = RocketChat.models.Messages.countVisibleByRoomIdBetweenTimestampsInclusive(group.rid, group.ls, group._room.lm);
			userMentions = group.userMentions;
			unreadsFrom = group.ls;
			joined = true;
		}
		
		if (access || joined) {
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
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId, checkedArchived: false });

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('eraseRoom', findResult.rid);
		});

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.processQueryOptionsOnResult([findResult._room], { fields: RocketChat.API.v1.defaultFieldsToExclude })[0]
		});
	}
});

RocketChat.API.v1.addRoute('groups.files', { authRequired: true }, {
	get() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId, checkedArchived: false });

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const ourQuery = Object.assign({}, query, { rid: findResult.rid });

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

RocketChat.API.v1.addRoute('groups.getIntegrations', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
			return RocketChat.API.v1.unauthorized();
		}

		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId, checkedArchived: false });

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
			fields
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
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId, checkedArchived: false });

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

		if (!result) {
			return RocketChat.API.v1.unauthorized();
		}

		return RocketChat.API.v1.success(result);
	}
});

RocketChat.API.v1.addRoute('groups.info', { authRequired: true }, {
	get() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId, checkedArchived: false });

		return RocketChat.API.v1.success({
			group: RocketChat.models.Rooms.findOneById(findResult.rid, { fields: RocketChat.API.v1.defaultFieldsToExclude })
		});
	}
});

RocketChat.API.v1.addRoute('groups.invite', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

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
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('removeUserFromRoom', { rid: findResult.rid, username: user.username });
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.leave', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

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
			fields
		});

		return RocketChat.API.v1.success({
			groups: rooms,
			offset,
			count: rooms.length,
			total: totalCount
		});
	}
});


RocketChat.API.v1.addRoute('groups.listAll', { authRequired: true }, {
	get() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
			return RocketChat.API.v1.unauthorized();
		}
		const { offset, count } = this.getPaginationItems();
		const { sort, fields } = this.parseJsonQuery();
		let rooms = RocketChat.models.Rooms.findByType('p').fetch();
		const totalCount = rooms.length;

		rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
			sort: sort ? sort : { name: 1 },
			skip: offset,
			limit: count,
			fields
		});

		return RocketChat.API.v1.success({
			groups: rooms,
			offset,
			count: rooms.length,
			total: totalCount
		});
	}
});

RocketChat.API.v1.addRoute('groups.members', { authRequired: true }, {
	get() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();

		let sortFn = (a, b) => a > b;
		if (Match.test(sort, Object) && Match.test(sort.username, Number) && sort.username === -1) {
			sortFn = (a, b) => b < a;
		}

		const members = RocketChat.models.Rooms.processQueryOptionsOnResult(Array.from(findResult._room.usernames).sort(sortFn), {
			skip: offset,
			limit: count
		});

		const users = RocketChat.models.Users.find({ username: { $in: members } }, {
			fields: { _id: 1, username: 1, name: 1, status: 1, utcOffset: 1 },
			sort: sort ? sort : { username: 1 }
		}).fetch();

		return RocketChat.API.v1.success({
			members: users,
			count: members.length,
			offset,
			total: findResult._room.usernames.length
		});
	}
});

RocketChat.API.v1.addRoute('groups.messages', { authRequired: true }, {
	get() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });
		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const ourQuery = Object.assign({}, query, { rid: findResult.rid });

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
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId, checkedArchived: false });

		if (findResult.open) {
			return RocketChat.API.v1.failure(`The private group, ${ findResult.name }, is already open for the sender`);
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('openRoom', findResult.rid);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.removeModerator', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('removeRoomModerator', findResult.rid, user._id);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.removeOwner', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('removeRoomOwner', findResult.rid, user._id);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.removeLeader', { authRequired: true }, {
	post() {
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

		const user = this.getUserFromParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('removeRoomLeader', findResult.rid, user._id);
		});

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('groups.rename', { authRequired: true }, {
	post() {
		if (!this.bodyParams.name || !this.bodyParams.name.trim()) {
			return RocketChat.API.v1.failure('The bodyParam "name" is required');
		}

		const findResult = findPrivateGroupByIdOrName({ params: { roomId: this.bodyParams.roomId}, userId: this.userId });

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

		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

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

		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

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

		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

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

		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

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

		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId });

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
		const findResult = findPrivateGroupByIdOrName({ params: this.requestParams(), userId: this.userId, checkedArchived: false });

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('unarchiveRoom', findResult.rid);
		});

		return RocketChat.API.v1.success();
	}
});
