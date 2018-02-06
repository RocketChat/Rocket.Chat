import _ from 'underscore';

class ModelSubscriptions extends RocketChat.models._Base {
	constructor() {
		super(...arguments);

		this.tryEnsureIndex({ 'rid': 1, 'u._id': 1 }, { unique: 1 });
		this.tryEnsureIndex({ 'rid': 1, 'alert': 1, 'u._id': 1 });
		this.tryEnsureIndex({ 'rid': 1, 'roles': 1 });
		this.tryEnsureIndex({ 'u._id': 1, 'name': 1, 't': 1 });
		this.tryEnsureIndex({ 'u._id': 1, 'name': 1, 't': 1, 'code': 1 }, { unique: 1 });
		this.tryEnsureIndex({ 'open': 1 });
		this.tryEnsureIndex({ 'alert': 1 });
		this.tryEnsureIndex({ 'unread': 1 });
		this.tryEnsureIndex({ 'ts': 1 });
		this.tryEnsureIndex({ 'ls': 1 });
		this.tryEnsureIndex({ 'audioNotifications': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'desktopNotifications': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'mobilePushNotifications': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'emailNotifications': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'autoTranslate': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'autoTranslateLanguage': 1 }, { sparse: 1 });

		this.cache.ensureIndex('rid', 'array');
		this.cache.ensureIndex('u._id', 'array');
		this.cache.ensureIndex('name', 'array');
		this.cache.ensureIndex(['rid', 'u._id'], 'unique');
		this.cache.ensureIndex(['name', 'u._id'], 'unique');
	}


	// FIND ONE
	findOneByRoomIdAndUserId(roomId, userId) {
		if (this.useCache) {
			return this.cache.findByIndex('rid,u._id', [roomId, userId]).fetch();
		}
		const query = {
			rid: roomId,
			'u._id': userId
		};

		return this.findOne(query);
	}

	findOneByRoomNameAndUserId(roomName, userId) {
		if (this.useCache) {
			return this.cache.findByIndex('name,u._id', [roomName, userId]).fetch();
		}
		const query = {
			name: roomName,
			'u._id': userId
		};

		return this.findOne(query);
	}

	// FIND
	findByUserId(userId, options) {
		if (this.useCache) {
			return this.cache.findByIndex('u._id', userId, options);
		}

		const query =
			{'u._id': userId};

		return this.find(query, options);
	}

	findByUserIdUpdatedAfter(userId, updatedAt, options) {
		const query = {
			'u._id': userId,
			_updatedAt: {
				$gt: updatedAt
			}
		};

		return this.find(query, options);
	}

	// FIND
	findByRoomIdAndRoles(roomId, roles, options) {
		roles = [].concat(roles);
		const query = {
			'rid': roomId,
			'roles': { $in: roles }
		};

		return this.find(query, options);
	}

	findByType(types, options) {
		const query = {
			t: {
				$in: types
			}
		};

		return this.find(query, options);
	}

	findByTypeAndUserId(type, userId, options) {
		const query = {
			t: type,
			'u._id': userId
		};

		return this.find(query, options);
	}

	findByTypeNameAndUserId(type, name, userId, options) {
		const query = {
			t: type,
			name,
			'u._id': userId
		};

		return this.find(query, options);
	}

	findByRoomId(roomId, options) {
		if (this.useCache) {
			return this.cache.findByIndex('rid', roomId, options);
		}

		const query =
			{rid: roomId};

		return this.find(query, options);
	}

	findByRoomIdAndNotUserId(roomId, userId, options) {
		const query = {
			rid: roomId,
			'u._id': {
				$ne: userId
			}
		};

		return this.find(query, options);
	}

	getLastSeen(options) {
		if (options == null) { options = {}; }
		const query = { ls: { $exists: 1 } };
		options.sort = { ls: -1 };
		options.limit = 1;
		const [subscription] = this.find(query, options).fetch();
		return subscription && subscription.ls;
	}

	findByRoomIdAndUserIds(roomId, userIds) {
		const query = {
			rid: roomId,
			'u._id': {
				$in: userIds
			}
		};

		return this.find(query);
	}

	findByRoomIdAndUserIdsOrAllMessages(roomId, userIds) {
		const query = {
			rid: roomId,
			$or: [
				{ 'u._id': { $in: userIds } },
				{ emailNotifications: 'all' }
			]
		};

		return this.find(query);
	}

	findUnreadByUserId(userId) {
		const query = {
			'u._id': userId,
			unread: {
				$gt: 0
			}
		};

		return this.find(query, { fields: { unread: 1 } });
	}

	getMinimumLastSeenByRoomId(rid) {
		return this.db.findOne({
			rid
		}, {
			sort: {
				ls: 1
			},
			fields: {
				ls: 1
			}
		});
	}

	// UPDATE
	archiveByRoomId(roomId) {
		const query =
			{rid: roomId};

		const update = {
			$set: {
				alert: false,
				open: false,
				archived: true
			}
		};

		return this.update(query, update, { multi: true });
	}

	unarchiveByRoomId(roomId) {
		const query =
			{rid: roomId};

		const update = {
			$set: {
				alert: false,
				open: true,
				archived: false
			}
		};

		return this.update(query, update, { multi: true });
	}

	hideByRoomIdAndUserId(roomId, userId) {
		const query = {
			rid: roomId,
			'u._id': userId
		};

		const update = {
			$set: {
				alert: false,
				open: false
			}
		};

		return this.update(query, update);
	}

	openByRoomIdAndUserId(roomId, userId) {
		const query = {
			rid: roomId,
			'u._id': userId
		};

		const update = {
			$set: {
				open: true
			}
		};

		return this.update(query, update);
	}

	setAsReadByRoomIdAndUserId(roomId, userId) {
		const query = {
			rid: roomId,
			'u._id': userId
		};

		const update = {
			$set: {
				open: true,
				alert: false,
				unread: 0,
				userMentions: 0,
				groupMentions: 0,
				ls: new Date
			}
		};

		return this.update(query, update);
	}

	setAsUnreadByRoomIdAndUserId(roomId, userId, firstMessageUnreadTimestamp) {
		const query = {
			rid: roomId,
			'u._id': userId
		};

		const update = {
			$set: {
				open: true,
				alert: true,
				ls: firstMessageUnreadTimestamp
			}
		};

		return this.update(query, update);
	}

	setFavoriteByRoomIdAndUserId(roomId, userId, favorite) {
		if (favorite == null) { favorite = true; }
		const query = {
			rid: roomId,
			'u._id': userId
		};

		const update = {
			$set: {
				f: favorite
			}
		};

		return this.update(query, update);
	}

	updateNameAndAlertByRoomId(roomId, name, fname) {
		const query =
			{rid: roomId};

		const update = {
			$set: {
				name,
				fname,
				alert: true
			}
		};

		return this.update(query, update, { multi: true });
	}

	updateNameByRoomId(roomId, name) {
		const query =
			{rid: roomId};

		const update = {
			$set: {
				name
			}
		};

		return this.update(query, update, { multi: true });
	}

	setUserUsernameByUserId(userId, username) {
		const query =
			{'u._id': userId};

		const update = {
			$set: {
				'u.username': username
			}
		};

		return this.update(query, update, { multi: true });
	}

	setNameForDirectRoomsWithOldName(oldName, name) {
		const query = {
			name: oldName,
			t: 'd'
		};

		const update = {
			$set: {
				name
			}
		};

		return this.update(query, update, { multi: true });
	}

	incUnreadForRoomIdExcludingUserId(roomId, userId, inc) {
		if (inc == null) { inc = 1; }
		const query = {
			rid: roomId,
			'u._id': {
				$ne: userId
			}
		};

		const update = {
			$set: {
				alert: true,
				open: true
			},
			$inc: {
				unread: inc
			}
		};

		return this.update(query, update, { multi: true });
	}

	incGroupMentionsAndUnreadForRoomIdExcludingUserId(roomId, userId, incGroup = 1, incUnread = 1) {
		const query = {
			rid: roomId,
			'u._id': {
				$ne: userId
			}
		};

		const update = {
			$set: {
				alert: true,
				open: true
			},
			$inc: {
				unread: incUnread,
				groupMentions: incGroup
			}
		};

		return this.update(query, update, { multi: true });
	}

	incUserMentionsAndUnreadForRoomIdAndUserIds(roomId, userIds, incUser = 1, incUnread = 1) {
		const query = {
			rid: roomId,
			'u._id': {
				$in: userIds
			}
		};

		const update = {
			$set: {
				alert: true,
				open: true
			},
			$inc: {
				unread: incUnread,
				userMentions: incUser
			}
		};

		return this.update(query, update, { multi: true });
	}
	setAlertForRoomIdExcludingUserId(roomId, userId) {
		const query = {
			rid: roomId,
			'u._id': {
				$ne: userId
			},
			$or: [
				{ alert: { $ne: true } },
				{ open: { $ne: true } }
			]
		};

		const update = {
			$set: {
				alert: true,
				open: true
			}
		};
		return this.update(query, update, { multi: true });
	}

	setBlockedByRoomId(rid, blocked, blocker) {
		const query = {
			rid,
			'u._id': blocked
		};

		const update = {
			$set: {
				blocked: true
			}
		};

		const query2 = {
			rid,
			'u._id': blocker
		};

		const update2 = {
			$set: {
				blocker: true
			}
		};

		return this.update(query, update) && this.update(query2, update2);
	}

	unsetBlockedByRoomId(rid, blocked, blocker) {
		const query = {
			rid,
			'u._id': blocked
		};

		const update = {
			$unset: {
				blocked: 1
			}
		};

		const query2 = {
			rid,
			'u._id': blocker
		};

		const update2 = {
			$unset: {
				blocker: 1
			}
		};

		return this.update(query, update) && this.update(query2, update2);
	}

	updateTypeByRoomId(roomId, type) {
		const query =
			{rid: roomId};

		const update = {
			$set: {
				t: type
			}
		};

		return this.update(query, update, { multi: true });
	}

	addRoleById(_id, role) {
		const query =
			{_id};

		const update = {
			$addToSet: {
				roles: role
			}
		};

		return this.update(query, update);
	}

	removeRoleById(_id, role) {
		const query =
			{_id};

		const update = {
			$pull: {
				roles: role
			}
		};

		return this.update(query, update);
	}

	setArchivedByUsername(username, archived) {
		const query = {
			t: 'd',
			name: username
		};

		const update = {
			$set: {
				archived
			}
		};

		return this.update(query, update, { multi: true });
	}

	// INSERT
	createWithRoomAndUser(room, user, extraData) {
		const subscription = {
			open: false,
			alert: false,
			unread: 0,
			userMentions: 0,
			groupMentions: 0,
			ts: room.ts,
			rid: room._id,
			name: room.name,
			fname: room.fname,
			t: room.t,
			u: {
				_id: user._id,
				username: user.username,
				name: user.name
			}
		};

		_.extend(subscription, extraData);

		return this.insert(subscription);
	}


	// REMOVE
	removeByUserId(userId) {
		const query =
			{'u._id': userId};

		return this.remove(query);
	}

	removeByRoomId(roomId) {
		const query =
			{rid: roomId};

		return this.remove(query);
	}

	removeByRoomIdAndUserId(roomId, userId) {
		const query = {
			rid: roomId,
			'u._id': userId
		};

		return this.remove(query);
	}
}

RocketChat.models.Subscriptions = new ModelSubscriptions('subscription', true);
