import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { mountIntegrationQueryBasedOnPermissions } from '../../../integrations/server/lib/mountQueriesBasedOnPermission';
import { Subscriptions, Rooms, Messages, Users } from '../../../models/server';
import { Integrations, Uploads } from '../../../models/server/raw';
import {
	hasPermission,
	hasAtLeastOnePermission,
	canAccessRoom,
	hasAllPermission,
	roomAccessAttributes,
} from '../../../authorization/server';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { API } from '../api';
import { Team } from '../../../../server/sdk';
import { findUsersOfRoom } from '../../../../server/lib/findUsersOfRoom';

// Returns the private group subscription IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
export function findPrivateGroupByIdOrName({ params, userId, checkedArchived = true }) {
	if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
		throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
	}

	const roomOptions = {
		fields: {
			...roomAccessAttributes,
			t: 1,
			ro: 1,
			name: 1,
			fname: 1,
			prid: 1,
			archived: 1,
			broadcast: 1,
		},
	};
	const room = params.roomId ? Rooms.findOneById(params.roomId, roomOptions) : Rooms.findOneByName(params.roomName, roomOptions);

	if (!room || room.t !== 'p') {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
	}

	const user = Users.findOneById(userId, { fields: { username: 1 } });

	if (!canAccessRoom(room, user)) {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
	}

	// discussions have their names saved on `fname` property
	const roomName = room.prid ? room.fname : room.name;

	if (checkedArchived && room.archived) {
		throw new Meteor.Error('error-room-archived', `The private group, ${roomName}, is archived`);
	}

	const sub = Subscriptions.findOneByRoomIdAndUserId(room._id, userId, { fields: { open: 1 } });

	return {
		rid: room._id,
		open: sub && sub.open,
		ro: room.ro,
		t: room.t,
		name: roomName,
		broadcast: room.broadcast,
	};
}

API.v1.addRoute(
	'groups.addAll',
	{ authRequired: true },
	{
		post() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('addAllUserToRoom', findResult.rid, this.bodyParams.activeUsersOnly);
			});

			return API.v1.success({
				group: this.composeRoomWithLastMessage(Rooms.findOneById(findResult.rid, { fields: API.v1.defaultFieldsToExclude }), this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.addModerator',
	{ authRequired: true },
	{
		post() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			const user = this.getUserFromParams();

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('addRoomModerator', findResult.rid, user._id);
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.addOwner',
	{ authRequired: true },
	{
		post() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			const user = this.getUserFromParams();

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('addRoomOwner', findResult.rid, user._id);
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.addLeader',
	{ authRequired: true },
	{
		post() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});
			const user = this.getUserFromParams();
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('addRoomLeader', findResult.rid, user._id);
			});

			return API.v1.success();
		},
	},
);

// Archives a private group only if it wasn't
API.v1.addRoute(
	'groups.archive',
	{ authRequired: true },
	{
		post() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('archiveRoom', findResult.rid);
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.close',
	{ authRequired: true },
	{
		post() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
				checkedArchived: false,
			});

			if (!findResult.open) {
				return API.v1.failure(`The private group, ${findResult.name}, is already closed to the sender`);
			}

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('hideRoom', findResult.rid);
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.counters',
	{ authRequired: true },
	{
		get() {
			const access = hasPermission(this.userId, 'view-room-administration');
			const params = this.requestParams();
			let user = this.userId;
			let room;
			let unreads = null;
			let userMentions = null;
			let unreadsFrom = null;
			let joined = false;
			let msgs = null;
			let latest = null;
			let members = null;

			if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
				throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
			}

			if (params.roomId) {
				room = Rooms.findOneById(params.roomId);
			} else if (params.roomName) {
				room = Rooms.findOneByName(params.roomName);
			}

			if (!room || room.t !== 'p') {
				throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
			}

			if (room.archived) {
				throw new Meteor.Error('error-room-archived', `The private group, ${room.name}, is archived`);
			}

			if (params.userId) {
				if (!access) {
					return API.v1.unauthorized();
				}
				user = params.userId;
			}
			const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, user);
			const lm = room.lm ? room.lm : room._updatedAt;

			if (typeof subscription !== 'undefined' && subscription.open) {
				unreads = Messages.countVisibleByRoomIdBetweenTimestampsInclusive(subscription.rid, subscription.ls || subscription.ts, lm);
				unreadsFrom = subscription.ls || subscription.ts;
				userMentions = subscription.userMentions;
				joined = true;
			}

			if (access || joined) {
				msgs = room.msgs;
				latest = lm;
				members = room.usersCount;
			}

			return API.v1.success({
				joined,
				members,
				unreads,
				unreadsFrom,
				msgs,
				latest,
				userMentions,
			});
		},
	},
);

// Create Private Group
API.v1.addRoute(
	'groups.create',
	{ authRequired: true },
	{
		post() {
			if (!hasPermission(this.userId, 'create-p')) {
				return API.v1.unauthorized();
			}

			if (!this.bodyParams.name) {
				return API.v1.failure('Body param "name" is required');
			}

			if (this.bodyParams.members && !_.isArray(this.bodyParams.members)) {
				return API.v1.failure('Body param "members" must be an array if provided');
			}

			if (this.bodyParams.customFields && !(typeof this.bodyParams.customFields === 'object')) {
				return API.v1.failure('Body param "customFields" must be an object if provided');
			}
			if (this.bodyParams.extraData && !(typeof this.bodyParams.extraData === 'object')) {
				return API.v1.failure('Body param "extraData" must be an object if provided');
			}

			const readOnly = typeof this.bodyParams.readOnly !== 'undefined' ? this.bodyParams.readOnly : false;

			let id;

			Meteor.runAsUser(this.userId, () => {
				id = Meteor.call(
					'createPrivateGroup',
					this.bodyParams.name,
					this.bodyParams.members ? this.bodyParams.members : [],
					readOnly,
					this.bodyParams.customFields,
					this.bodyParams.extraData,
				);
			});

			return API.v1.success({
				group: this.composeRoomWithLastMessage(Rooms.findOneById(id.rid, { fields: API.v1.defaultFieldsToExclude }), this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.delete',
	{ authRequired: true },
	{
		post() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
				checkedArchived: false,
			});

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('eraseRoom', findResult.rid);
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.files',
	{ authRequired: true },
	{
		get() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
				checkedArchived: false,
			});
			const addUserObjectToEveryObject = (file) => {
				if (file.userId) {
					file = this.insertUserObject({ object: file, userId: file.userId });
				}
				return file;
			};

			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();

			const ourQuery = Object.assign({}, query, { rid: findResult.rid });

			const files = Promise.await(
				Uploads.find(ourQuery, {
					sort: sort || { name: 1 },
					skip: offset,
					limit: count,
					fields,
				}).toArray(),
			);

			return API.v1.success({
				files: files.map(addUserObjectToEveryObject),
				count: files.length,
				offset,
				total: Promise.await(Uploads.find(ourQuery).count()),
			});
		},
	},
);

API.v1.addRoute(
	'groups.getIntegrations',
	{ authRequired: true },
	{
		get() {
			if (
				!hasAtLeastOnePermission(this.userId, [
					'manage-outgoing-integrations',
					'manage-own-outgoing-integrations',
					'manage-incoming-integrations',
					'manage-own-incoming-integrations',
				])
			) {
				return API.v1.unauthorized();
			}

			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
				checkedArchived: false,
			});

			let includeAllPrivateGroups = true;
			if (typeof this.queryParams.includeAllPrivateGroups !== 'undefined') {
				includeAllPrivateGroups = this.queryParams.includeAllPrivateGroups === 'true';
			}

			const channelsToSearch = [`#${findResult.name}`];
			if (includeAllPrivateGroups) {
				channelsToSearch.push('all_private_groups');
			}

			const { offset, count } = this.getPaginationItems();
			const { sort, fields: projection, query } = this.parseJsonQuery();

			const ourQuery = Object.assign(mountIntegrationQueryBasedOnPermissions(this.userId), query, {
				channel: { $in: channelsToSearch },
			});
			const cursor = Integrations.find(ourQuery, {
				sort: sort || { _createdAt: 1 },
				skip: offset,
				limit: count,
				projection,
			});

			const integrations = Promise.await(cursor.toArray());
			const total = Promise.await(cursor.count());

			return API.v1.success({
				integrations,
				count: integrations.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'groups.history',
	{ authRequired: true },
	{
		get() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
				checkedArchived: false,
			});

			let latestDate = new Date();
			if (this.queryParams.latest) {
				latestDate = new Date(this.queryParams.latest);
			}

			let oldestDate = undefined;
			if (this.queryParams.oldest) {
				oldestDate = new Date(this.queryParams.oldest);
			}

			const inclusive = this.queryParams.inclusive || false;

			let count = 20;
			if (this.queryParams.count) {
				count = parseInt(this.queryParams.count);
			}

			let offset = 0;
			if (this.queryParams.offset) {
				offset = parseInt(this.queryParams.offset);
			}

			const unreads = this.queryParams.unreads || false;

			const showThreadMessages = this.queryParams.showThreadMessages !== 'false';

			const result = Meteor.call('getChannelHistory', {
				rid: findResult.rid,
				latest: latestDate,
				oldest: oldestDate,
				inclusive,
				offset,
				count,
				unreads,
				showThreadMessages,
			});

			if (!result) {
				return API.v1.unauthorized();
			}

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'groups.info',
	{ authRequired: true },
	{
		get() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
				checkedArchived: false,
			});

			return API.v1.success({
				group: this.composeRoomWithLastMessage(Rooms.findOneById(findResult.rid, { fields: API.v1.defaultFieldsToExclude }), this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.invite',
	{ authRequired: true },
	{
		post() {
			const { roomId = '', roomName = '' } = this.requestParams();
			const idOrName = roomId || roomName;
			if (!idOrName.trim()) {
				throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
			}

			const { _id: rid, t: type } = Rooms.findOneByIdOrName(idOrName) || {};

			if (!rid || type !== 'p') {
				throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
			}

			const users = this.getUserListFromParams();

			if (!users.length) {
				throw new Meteor.Error('error-empty-invite-list', 'Cannot invite if no valid users are provided');
			}

			Meteor.runAsUser(this.userId, () => Meteor.call('addUsersToRoom', { rid, users: users.map((u) => u.username) }));

			return API.v1.success({
				group: this.composeRoomWithLastMessage(Rooms.findOneById(rid, { fields: API.v1.defaultFieldsToExclude }), this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.kick',
	{ authRequired: true },
	{
		post() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			const user = this.getUserFromParams();

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('removeUserFromRoom', { rid: findResult.rid, username: user.username });
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.leave',
	{ authRequired: true },
	{
		post() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('leaveRoom', findResult.rid);
			});

			return API.v1.success();
		},
	},
);

// List Private Groups a user has access to
API.v1.addRoute(
	'groups.list',
	{ authRequired: true },
	{
		get() {
			const { offset, count } = this.getPaginationItems();
			const { sort, fields } = this.parseJsonQuery();

			// TODO: CACHE: Add Breacking notice since we removed the query param
			const cursor = Rooms.findBySubscriptionTypeAndUserId('p', this.userId, {
				sort: sort || { name: 1 },
				skip: offset,
				limit: count,
				fields,
			});

			const totalCount = cursor.count();
			const rooms = cursor.fetch();

			return API.v1.success({
				groups: rooms.map((room) => this.composeRoomWithLastMessage(room, this.userId)),
				offset,
				count: rooms.length,
				total: totalCount,
			});
		},
	},
);

API.v1.addRoute(
	'groups.listAll',
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'view-room-administration')) {
				return API.v1.unauthorized();
			}
			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();
			const ourQuery = Object.assign({}, query, { t: 'p' });

			const cursor = Rooms.find(ourQuery, {
				sort: sort || { name: 1 },
				skip: offset,
				limit: count,
				fields,
			});

			const totalCount = cursor.count();
			const rooms = cursor.fetch();

			return API.v1.success({
				groups: rooms.map((room) => this.composeRoomWithLastMessage(room, this.userId)),
				offset,
				count: rooms.length,
				total: totalCount,
			});
		},
	},
);

API.v1.addRoute(
	'groups.members',
	{ authRequired: true },
	{
		get() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			if (findResult.broadcast && !hasPermission(this.userId, 'view-broadcast-member-list', findResult.rid)) {
				return API.v1.unauthorized();
			}

			const { offset: skip, count: limit } = this.getPaginationItems();
			const { sort = {} } = this.parseJsonQuery();

			check(
				this.queryParams,
				Match.ObjectIncluding({
					status: Match.Maybe([String]),
					filter: Match.Maybe(String),
				}),
			);
			const { status, filter } = this.queryParams;

			const cursor = findUsersOfRoom({
				rid: findResult.rid,
				...(status && { status: { $in: status } }),
				skip,
				limit,
				filter,
				...(sort?.username && { sort: { username: sort.username } }),
			});

			const total = cursor.count();
			const members = cursor.fetch();

			return API.v1.success({
				members,
				count: members.length,
				offset: skip,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'groups.messages',
	{ authRequired: true },
	{
		get() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});
			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();

			const ourQuery = Object.assign({}, query, { rid: findResult.rid });

			const messages = Messages.find(ourQuery, {
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
				fields,
			}).fetch();

			return API.v1.success({
				messages: normalizeMessagesForUser(messages, this.userId),
				count: messages.length,
				offset,
				total: Messages.find(ourQuery).count(),
			});
		},
	},
);
// TODO: CACHE: same as channels.online
API.v1.addRoute(
	'groups.online',
	{ authRequired: true },
	{
		get() {
			const { query } = this.parseJsonQuery();
			if (!query || Object.keys(query).length === 0) {
				return API.v1.failure('Invalid query');
			}

			const ourQuery = Object.assign({}, query, { t: 'p' });

			const room = Rooms.findOne(ourQuery);

			if (room == null) {
				return API.v1.failure('Group does not exists');
			}

			const user = this.getLoggedInUser();

			if (!canAccessRoom(room, user)) {
				throw new Meteor.Error('error-not-allowed', 'Not Allowed');
			}

			const online = Users.findUsersNotOffline({
				fields: {
					username: 1,
				},
			}).fetch();

			const onlineInRoom = [];
			online.forEach((user) => {
				const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, {
					fields: { _id: 1 },
				});
				if (subscription) {
					onlineInRoom.push({
						_id: user._id,
						username: user.username,
					});
				}
			});

			return API.v1.success({
				online: onlineInRoom,
			});
		},
	},
);

API.v1.addRoute(
	'groups.open',
	{ authRequired: true },
	{
		post() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
				checkedArchived: false,
			});

			if (findResult.open) {
				return API.v1.failure(`The private group, ${findResult.name}, is already open for the sender`);
			}

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('openRoom', findResult.rid);
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.removeModerator',
	{ authRequired: true },
	{
		post() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			const user = this.getUserFromParams();

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('removeRoomModerator', findResult.rid, user._id);
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.removeOwner',
	{ authRequired: true },
	{
		post() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			const user = this.getUserFromParams();

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('removeRoomOwner', findResult.rid, user._id);
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.removeLeader',
	{ authRequired: true },
	{
		post() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			const user = this.getUserFromParams();

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('removeRoomLeader', findResult.rid, user._id);
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.rename',
	{ authRequired: true },
	{
		post() {
			if (!this.bodyParams.name || !this.bodyParams.name.trim()) {
				return API.v1.failure('The bodyParam "name" is required');
			}

			const findResult = findPrivateGroupByIdOrName({
				params: { roomId: this.bodyParams.roomId },
				userId: this.userId,
			});

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult.rid, 'roomName', this.bodyParams.name);
			});

			return API.v1.success({
				group: this.composeRoomWithLastMessage(Rooms.findOneById(findResult.rid, { fields: API.v1.defaultFieldsToExclude }), this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.setCustomFields',
	{ authRequired: true },
	{
		post() {
			if (!this.bodyParams.customFields || !(typeof this.bodyParams.customFields === 'object')) {
				return API.v1.failure('The bodyParam "customFields" is required with a type like object.');
			}

			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult.rid, 'roomCustomFields', this.bodyParams.customFields);
			});

			return API.v1.success({
				group: this.composeRoomWithLastMessage(Rooms.findOneById(findResult.rid, { fields: API.v1.defaultFieldsToExclude }), this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.setDescription',
	{ authRequired: true },
	{
		post() {
			if (!this.bodyParams.hasOwnProperty('description')) {
				return API.v1.failure('The bodyParam "description" is required');
			}

			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.description);
			});

			return API.v1.success({
				description: this.bodyParams.description,
			});
		},
	},
);

API.v1.addRoute(
	'groups.setPurpose',
	{ authRequired: true },
	{
		post() {
			if (!this.bodyParams.hasOwnProperty('purpose')) {
				return API.v1.failure('The bodyParam "purpose" is required');
			}

			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.purpose);
			});

			return API.v1.success({
				purpose: this.bodyParams.purpose,
			});
		},
	},
);

API.v1.addRoute(
	'groups.setReadOnly',
	{ authRequired: true },
	{
		post() {
			if (typeof this.bodyParams.readOnly === 'undefined') {
				return API.v1.failure('The bodyParam "readOnly" is required');
			}

			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			if (findResult.ro === this.bodyParams.readOnly) {
				return API.v1.failure('The private group read only setting is the same as what it would be changed to.');
			}

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult.rid, 'readOnly', this.bodyParams.readOnly);
			});

			return API.v1.success({
				group: this.composeRoomWithLastMessage(Rooms.findOneById(findResult.rid, { fields: API.v1.defaultFieldsToExclude }), this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.setTopic',
	{ authRequired: true },
	{
		post() {
			if (!this.bodyParams.hasOwnProperty('topic')) {
				return API.v1.failure('The bodyParam "topic" is required');
			}

			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult.rid, 'roomTopic', this.bodyParams.topic);
			});

			return API.v1.success({
				topic: this.bodyParams.topic,
			});
		},
	},
);

API.v1.addRoute(
	'groups.setType',
	{ authRequired: true },
	{
		post() {
			if (!this.bodyParams.type || !this.bodyParams.type.trim()) {
				return API.v1.failure('The bodyParam "type" is required');
			}

			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			if (findResult.t === this.bodyParams.type) {
				return API.v1.failure('The private group type is the same as what it would be changed to.');
			}

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult.rid, 'roomType', this.bodyParams.type);
			});

			return API.v1.success({
				group: this.composeRoomWithLastMessage(Rooms.findOneById(findResult.rid, { fields: API.v1.defaultFieldsToExclude }), this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.setAnnouncement',
	{ authRequired: true },
	{
		post() {
			if (!this.bodyParams.hasOwnProperty('announcement')) {
				return API.v1.failure('The bodyParam "announcement" is required');
			}

			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('saveRoomSettings', findResult.rid, 'roomAnnouncement', this.bodyParams.announcement);
			});

			return API.v1.success({
				announcement: this.bodyParams.announcement,
			});
		},
	},
);

API.v1.addRoute(
	'groups.unarchive',
	{ authRequired: true },
	{
		post() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
				checkedArchived: false,
			});

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('unarchiveRoom', findResult.rid);
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'groups.roles',
	{ authRequired: true },
	{
		get() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			const roles = Meteor.runAsUser(this.userId, () => Meteor.call('getRoomRoles', findResult.rid));

			return API.v1.success({
				roles,
			});
		},
	},
);

API.v1.addRoute(
	'groups.moderators',
	{ authRequired: true },
	{
		get() {
			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			const moderators = Subscriptions.findByRoomIdAndRoles(findResult.rid, ['moderator'], {
				fields: { u: 1 },
			})
				.fetch()
				.map((sub) => sub.u);

			return API.v1.success({
				moderators,
			});
		},
	},
);

API.v1.addRoute(
	'groups.setEncrypted',
	{ authRequired: true },
	{
		post() {
			if (!Match.test(this.bodyParams, Match.ObjectIncluding({ encrypted: Boolean }))) {
				return API.v1.failure('The bodyParam "encrypted" is required');
			}

			const findResult = findPrivateGroupByIdOrName({
				params: this.requestParams(),
				userId: this.userId,
			});

			Meteor.call('saveRoomSettings', findResult.rid, 'encrypted', this.bodyParams.encrypted);

			return API.v1.success({
				group: this.composeRoomWithLastMessage(Rooms.findOneById(findResult.rid, { fields: API.v1.defaultFieldsToExclude }), this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'groups.convertToTeam',
	{ authRequired: true },
	{
		post() {
			const { roomId, roomName } = this.requestParams();

			if (!roomId && !roomName) {
				return API.v1.failure('The parameter "roomId" or "roomName" is required');
			}

			const room = findPrivateGroupByIdOrName({
				params: {
					roomId,
					roomName,
				},
				userId: this.userId,
			});

			if (!room) {
				return API.v1.failure('Private group not found');
			}

			if (!hasAllPermission(this.userId, ['create-team', 'edit-room'], room.rid)) {
				return API.v1.unauthorized();
			}

			const subscriptions = Subscriptions.findByRoomId(room.rid, {
				fields: { 'u._id': 1 },
			});

			const members = subscriptions.fetch().map((s) => s.u && s.u._id);

			const teamData = {
				team: {
					name: room.name,
					type: 1,
				},
				members,
				room: {
					name: room.name,
					id: room.rid,
				},
			};

			const team = Promise.await(Team.create(this.userId, teamData));

			return API.v1.success({ team });
		},
	},
);
