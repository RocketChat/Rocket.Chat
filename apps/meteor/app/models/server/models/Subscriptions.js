import { Meteor } from 'meteor/meteor';

import { Base } from './_Base';

class Subscriptions extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ rid: 1 });
		this.tryEnsureIndex({ rid: 1, ls: 1 });
		this.tryEnsureIndex({ 'rid': 1, 'u._id': 1 }, { unique: 1 });
		this.tryEnsureIndex({ 'rid': 1, 'u._id': 1, 'open': 1 });
		this.tryEnsureIndex({ 'rid': 1, 'u.username': 1 });
		this.tryEnsureIndex({ 'rid': 1, 'alert': 1, 'u._id': 1 });
		this.tryEnsureIndex({ rid: 1, roles: 1 });
		this.tryEnsureIndex({ 'u._id': 1, 'name': 1, 't': 1 });
		this.tryEnsureIndex({ name: 1, t: 1 });
		this.tryEnsureIndex({ open: 1 });
		this.tryEnsureIndex({ alert: 1 });
		this.tryEnsureIndex({ ts: 1 });
		this.tryEnsureIndex({ ls: 1 });
		this.tryEnsureIndex({ desktopNotifications: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ mobilePushNotifications: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ emailNotifications: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ autoTranslate: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ autoTranslateLanguage: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'userHighlights.0': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ prid: 1 });
		this.tryEnsureIndex({ 'u._id': 1, 'open': 1, 'department': 1 });

		const collectionObj = this.model.rawCollection();
		this.distinct = Meteor.wrapAsync(collectionObj.distinct, collectionObj);
	}

	removeByVisitorToken(token) {
		const query = {
			'v.token': token,
		};

		this.remove(query);
	}

	changeDepartmentByRoomId(rid, department) {
		const query = {
			rid,
		};
		const update = {
			$set: {
				department,
			},
		};

		this.update(query, update);
	}

	// FIND ONE
	findOneByRoomIdAndUserId(roomId, userId, options = {}) {
		const query = {
			'rid': roomId,
			'u._id': userId,
		};

		return this.findOne(query, options);
	}

	// FIND
	findByRoomIdAndNotUserId(roomId, userId, options = {}) {
		const query = {
			'rid': roomId,
			'u._id': {
				$ne: userId,
			},
		};

		return this.find(query, options);
	}

	findByRoomWithUserHighlights(roomId, options) {
		const query = {
			'rid': roomId,
			'userHighlights.0': { $exists: true },
		};

		return this.find(query, options);
	}

	getLastSeen(options = { fields: { _id: 0, ls: 1 } }) {
		options.sort = { ls: -1 };
		options.limit = 1;
		const [subscription] = this.find({}, options).fetch();
		return subscription?.ls;
	}

	findByRoomIdAndUserIds(roomId, userIds, options) {
		const query = {
			'rid': roomId,
			'u._id': {
				$in: userIds,
			},
		};

		return this.find(query, options);
	}

	findByRoomIdAndUserIdsOrAllMessages(roomId, userIds) {
		const query = {
			rid: roomId,
			$or: [{ 'u._id': { $in: userIds } }, { emailNotifications: 'all' }],
		};

		return this.find(query);
	}

	findByRoomIdWhenUserIdExists(rid, options) {
		const query = { rid, 'u._id': { $exists: 1 } };

		return this.find(query, options);
	}

	findByRoomIdWhenUsernameExists(rid, options) {
		const query = { rid, 'u.username': { $exists: 1 } };

		return this.find(query, options);
	}

	findUnreadByUserId(userId) {
		const query = {
			'u._id': userId,
			'unread': {
				$gt: 0,
			},
		};

		return this.find(query, { fields: { unread: 1 } });
	}

	getMinimumLastSeenByRoomId(rid) {
		return this.db.findOne(
			{
				rid,
			},
			{
				sort: {
					ls: 1,
				},
				fields: {
					ls: 1,
				},
			},
		);
	}

	// UPDATE
	archiveByRoomId(roomId) {
		const query = { rid: roomId };

		const update = {
			$set: {
				alert: false,
				open: false,
				archived: true,
			},
		};

		return this.update(query, update, { multi: true });
	}

	unarchiveByRoomId(roomId) {
		const query = { rid: roomId };

		const update = {
			$set: {
				alert: false,
				open: true,
				archived: false,
			},
		};

		return this.update(query, update, { multi: true });
	}

	hideByRoomIdAndUserId(roomId, userId) {
		const query = {
			'rid': roomId,
			'u._id': userId,
		};

		const update = {
			$set: {
				alert: false,
				open: false,
			},
		};

		return this.update(query, update);
	}

	openByRoomIdAndUserId(roomId, userId) {
		const query = {
			'rid': roomId,
			'u._id': userId,
		};

		const update = {
			$set: {
				open: true,
			},
		};

		return this.update(query, update);
	}

	setAsUnreadByRoomIdAndUserId(roomId, userId, firstMessageUnreadTimestamp) {
		const query = {
			'rid': roomId,
			'u._id': userId,
		};

		const update = {
			$set: {
				open: true,
				alert: true,
				ls: firstMessageUnreadTimestamp,
			},
		};

		return this.update(query, update);
	}
}

export default new Subscriptions('subscription', true);
