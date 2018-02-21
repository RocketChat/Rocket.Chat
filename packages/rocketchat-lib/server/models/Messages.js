import _ from 'underscore';

RocketChat.models.Messages = new class extends RocketChat.models._Base {
	constructor() {
		super('message');

		this.tryEnsureIndex({ 'rid': 1, 'ts': 1 });
		this.tryEnsureIndex({ 'ts': 1 });
		this.tryEnsureIndex({ 'u._id': 1 });
		this.tryEnsureIndex({ 'editedAt': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'editedBy._id': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'rid': 1, 't': 1, 'u._id': 1 });
		this.tryEnsureIndex({ 'expireAt': 1 }, { expireAfterSeconds: 0 });
		this.tryEnsureIndex({ 'msg': 'text' });
		this.tryEnsureIndex({ 'file._id': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'mentions.username': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'pinned': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'snippeted': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'location': '2dsphere' });
		this.tryEnsureIndex({ 'slackBotId': 1, 'slackTs': 1 }, { sparse: 1 });
	}

	// FIND
	findByMention(username, options) {
		const query =	{'mentions.username': username};

		return this.find(query, options);
	}

	findVisibleByMentionAndRoomId(username, rid, options) {
		const query = {
			_hidden: { $ne: true },
			'mentions.username': username,
			rid
		};

		return this.find(query, options);
	}

	findVisibleByRoomId(roomId, options) {
		const query = {
			_hidden: {
				$ne: true
			},

			rid: roomId
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdNotContainingTypes(roomId, types, options) {
		const query = {
			_hidden: {
				$ne: true
			},

			rid: roomId
		};

		if (Match.test(types, [String]) && (types.length > 0)) {
			query.t =
			{$nin: types};
		}

		return this.find(query, options);
	}

	findInvisibleByRoomId(roomId, options) {
		const query = {
			_hidden: true,
			rid: roomId
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdAfterTimestamp(roomId, timestamp, options) {
		const query = {
			_hidden: {
				$ne: true
			},
			rid: roomId,
			ts: {
				$gt: timestamp
			}
		};

		return this.find(query, options);
	}

	findForUpdates(roomId, timestamp, options) {
		const query = {
			_hidden: {
				$ne: true
			},
			rid: roomId,
			_updatedAt: {
				$gt: timestamp
			}
		};
		return this.find(query, options);
	}

	findVisibleByRoomIdBeforeTimestamp(roomId, timestamp, options) {
		const query = {
			_hidden: {
				$ne: true
			},
			rid: roomId,
			ts: {
				$lt: timestamp
			}
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdBeforeTimestampInclusive(roomId, timestamp, options) {
		const query = {
			_hidden: {
				$ne: true
			},
			rid: roomId,
			ts: {
				$lte: timestamp
			}
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdBetweenTimestamps(roomId, afterTimestamp, beforeTimestamp, options) {
		const query = {
			_hidden: {
				$ne: true
			},
			rid: roomId,
			ts: {
				$gt: afterTimestamp,
				$lt: beforeTimestamp
			}
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdBetweenTimestampsInclusive(roomId, afterTimestamp, beforeTimestamp, options) {
		const query = {
			_hidden: {
				$ne: true
			},
			rid: roomId,
			ts: {
				$gte: afterTimestamp,
				$lte: beforeTimestamp
			}
		};

		return this.find(query, options);
	}

	findVisibleByRoomIdBeforeTimestampNotContainingTypes(roomId, timestamp, types, options) {
		const query = {
			_hidden: {
				$ne: true
			},
			rid: roomId,
			ts: {
				$lt: timestamp
			}
		};

		if (Match.test(types, [String]) && (types.length > 0)) {
			query.t =
			{$nin: types};
		}

		return this.find(query, options);
	}

	findVisibleByRoomIdBetweenTimestampsNotContainingTypes(roomId, afterTimestamp, beforeTimestamp, types, options) {
		const query = {
			_hidden: {
				$ne: true
			},
			rid: roomId,
			ts: {
				$gt: afterTimestamp,
				$lt: beforeTimestamp
			}
		};

		if (Match.test(types, [String]) && (types.length > 0)) {
			query.t =
			{$nin: types};
		}

		return this.find(query, options);
	}

	findVisibleCreatedOrEditedAfterTimestamp(timestamp, options) {
		const query = {
			_hidden: { $ne: true },
			$or: [{
				ts: {
					$gt: timestamp
				}
			},
			{
				'editedAt': {
					$gt: timestamp
				}
			}
			]
		};

		return this.find(query, options);
	}

	findStarredByUserAtRoom(userId, roomId, options) {
		const query = {
			_hidden: { $ne: true },
			'starred._id': userId,
			rid: roomId
		};

		return this.find(query, options);
	}

	findPinnedByRoom(roomId, options) {
		const query = {
			t: { $ne: 'rm' },
			_hidden: { $ne: true },
			pinned: true,
			rid: roomId
		};

		return this.find(query, options);
	}

	findSnippetedByRoom(roomId, options) {
		const query = {
			_hidden: { $ne: true },
			snippeted: true,
			rid: roomId
		};

		return this.find(query, options);
	}

	getLastTimestamp(options) {
		if (options == null) { options = {}; }
		const query = { ts: { $exists: 1 } };
		options.sort = { ts: -1 };
		options.limit = 1;
		const [message] = this.find(query, options).fetch();
		return message && message.ts;
	}

	findByRoomIdAndMessageIds(rid, messageIds, options) {
		const query = {
			rid,
			_id: {
				$in: messageIds
			}
		};

		return this.find(query, options);
	}

	findOneBySlackBotIdAndSlackTs(slackBotId, slackTs) {
		const query = {
			slackBotId,
			slackTs
		};

		return this.findOne(query);
	}

	findOneBySlackTs(slackTs) {
		const query = {slackTs};

		return this.findOne(query);
	}

	findByRoomId(roomId, options) {
		const query = {
			rid: roomId
		};

		return this.find(query, options);
	}

	getLastVisibleMessageSentWithNoTypeByRoomId(rid, messageId) {
		const query = {
			rid,
			_hidden: { $ne: true },
			t: { $exists: false }
		};

		if (messageId) {
			query._id = { $ne: messageId };
		}

		const options = {
			sort: {
				ts: -1
			}
		};

		return this.findOne(query, options);
	}

	cloneAndSaveAsHistoryById(_id) {
		const me = RocketChat.models.Users.findOneById(Meteor.userId());
		const record = this.findOneById(_id);
		record._hidden = true;
		record.parent = record._id;
		record.editedAt = new Date;
		record.editedBy = {
			_id: Meteor.userId(),
			username: me.username
		};
		delete record._id;
		return this.insert(record);
	}

	// UPDATE
	setHiddenById(_id, hidden) {
		if (hidden == null) { hidden = true; }
		const query =	{_id};

		const update = {
			$set: {
				_hidden: hidden
			}
		};

		return this.update(query, update);
	}

	setAsDeletedByIdAndUser(_id, user) {
		const query =	{_id};

		const update = {
			$set: {
				msg: '',
				t: 'rm',
				urls: [],
				mentions: [],
				attachments: [],
				reactions: [],
				editedAt: new Date(),
				editedBy: {
					_id: user._id,
					username: user.username
				}
			}
		};

		return this.update(query, update);
	}

	setPinnedByIdAndUserId(_id, pinnedBy, pinned, pinnedAt) {
		if (pinned == null) { pinned = true; }
		if (pinnedAt == null) { pinnedAt = 0; }
		const query =	{_id};

		const update = {
			$set: {
				pinned,
				pinnedAt: pinnedAt || new Date,
				pinnedBy
			}
		};

		return this.update(query, update);
	}

	setSnippetedByIdAndUserId(message, snippetName, snippetedBy, snippeted, snippetedAt) {
		if (snippeted == null) { snippeted = true; }
		if (snippetedAt == null) { snippetedAt = 0; }
		const query =	{_id: message._id};

		const msg = `\`\`\`${ message.msg }\`\`\``;

		const update = {
			$set: {
				msg,
				snippeted,
				snippetedAt: snippetedAt || new Date,
				snippetedBy,
				snippetName
			}
		};

		return this.update(query, update);
	}

	setUrlsById(_id, urls) {
		const query =	{_id};

		const update = {
			$set: {
				urls
			}
		};

		return this.update(query, update);
	}

	updateAllUsernamesByUserId(userId, username) {
		const query =	{'u._id': userId};

		const update = {
			$set: {
				'u.username': username
			}
		};

		return this.update(query, update, { multi: true });
	}

	updateUsernameOfEditByUserId(userId, username) {
		const query =	{'editedBy._id': userId};

		const update = {
			$set: {
				'editedBy.username': username
			}
		};

		return this.update(query, update, { multi: true });
	}

	updateUsernameAndMessageOfMentionByIdAndOldUsername(_id, oldUsername, newUsername, newMessage) {
		const query = {
			_id,
			'mentions.username': oldUsername
		};

		const update = {
			$set: {
				'mentions.$.username': newUsername,
				'msg': newMessage
			}
		};

		return this.update(query, update);
	}

	updateUserStarById(_id, userId, starred) {
		let update;
		const query =	{_id};

		if (starred) {
			update = {
				$addToSet: {
					starred: { _id: userId }
				}
			};
		} else {
			update = {
				$pull: {
					starred: { _id: Meteor.userId() }
				}
			};
		}

		return this.update(query, update);
	}

	upgradeEtsToEditAt() {
		const query =	{ets: { $exists: 1 }};

		const update = {
			$rename: {
				'ets': 'editedAt'
			}
		};

		return this.update(query, update, { multi: true });
	}

	setMessageAttachments(_id, attachments) {
		const query =	{_id};

		const update = {
			$set: {
				attachments
			}
		};

		return this.update(query, update);
	}

	setSlackBotIdAndSlackTs(_id, slackBotId, slackTs) {
		const query =	{_id};

		const update = {
			$set: {
				slackBotId,
				slackTs
			}
		};

		return this.update(query, update);
	}


	// INSERT
	createWithTypeRoomIdMessageAndUser(type, roomId, message, user, extraData) {
		const room = RocketChat.models.Rooms.findOneById(roomId, { fields: { sysMes: 1 }});
		if ((room != null ? room.sysMes : undefined) === false) {
			return;
		}
		const record = {
			t: type,
			rid: roomId,
			ts: new Date,
			msg: message,
			u: {
				_id: user._id,
				username: user.username
			},
			groupable: false
		};

		if (RocketChat.settings.get('Message_Read_Receipt_Enabled')) {
			record.unread = true;
		}

		_.extend(record, extraData);

		record._id = this.insertOrUpsert(record);
		RocketChat.models.Rooms.incMsgCountById(room._id, 1);
		return record;
	}

	createUserJoinWithRoomIdAndUser(roomId, user, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('uj', roomId, message, user, extraData);
	}

	createUserLeaveWithRoomIdAndUser(roomId, user, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('ul', roomId, message, user, extraData);
	}

	createUserRemovedWithRoomIdAndUser(roomId, user, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('ru', roomId, message, user, extraData);
	}

	createUserAddedWithRoomIdAndUser(roomId, user, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('au', roomId, message, user, extraData);
	}

	createCommandWithRoomIdAndUser(command, roomId, user, extraData) {
		return this.createWithTypeRoomIdMessageAndUser('command', roomId, command, user, extraData);
	}

	createUserMutedWithRoomIdAndUser(roomId, user, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('user-muted', roomId, message, user, extraData);
	}

	createUserUnmutedWithRoomIdAndUser(roomId, user, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('user-unmuted', roomId, message, user, extraData);
	}

	createNewModeratorWithRoomIdAndUser(roomId, user, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('new-moderator', roomId, message, user, extraData);
	}

	createModeratorRemovedWithRoomIdAndUser(roomId, user, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('moderator-removed', roomId, message, user, extraData);
	}

	createNewOwnerWithRoomIdAndUser(roomId, user, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('new-owner', roomId, message, user, extraData);
	}

	createOwnerRemovedWithRoomIdAndUser(roomId, user, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('owner-removed', roomId, message, user, extraData);
	}

	createNewLeaderWithRoomIdAndUser(roomId, user, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('new-leader', roomId, message, user, extraData);
	}

	createLeaderRemovedWithRoomIdAndUser(roomId, user, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('leader-removed', roomId, message, user, extraData);
	}

	createSubscriptionRoleAddedWithRoomIdAndUser(roomId, user, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('subscription-role-added', roomId, message, user, extraData);
	}

	createSubscriptionRoleRemovedWithRoomIdAndUser(roomId, user, extraData) {
		const message = user.username;
		return this.createWithTypeRoomIdMessageAndUser('subscription-role-removed', roomId, message, user, extraData);
	}

	// REMOVE
	removeById(_id) {
		const query =	{_id};

		return this.remove(query);
	}

	removeByRoomId(roomId) {
		const query =	{rid: roomId};

		return this.remove(query);
	}

	removeByUserId(userId) {
		const query =	{'u._id': userId};

		return this.remove(query);
	}

	getMessageByFileId(fileID) {
		return this.findOne({ 'file._id': fileID });
	}

	setAsRead(rid, until) {
		return this.update({
			rid,
			unread: true,
			ts: { $lt: until }
		}, {
			$unset: {
				unread: 1
			}
		}, {
			multi: true
		});
	}

	setAsReadById(_id) {
		return this.update({
			_id
		}, {
			$unset: {
				unread: 1
			}
		});
	}

	findUnreadMessagesByRoomAndDate(rid, after) {
		const query = {
			unread: true,
			rid
		};

		if (after) {
			query.ts = { $gt: after };
		}

		return this.find(query, {
			fields: {
				_id: 1
			}
		});
	}
};
