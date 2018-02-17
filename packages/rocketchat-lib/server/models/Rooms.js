import _ from 'underscore';
import s from 'underscore.string';

class ModelRooms extends RocketChat.models._Base {
	constructor() {
		super(...arguments);

		this.tryEnsureIndex({ 'name': 1 }, { unique: 1, sparse: 1 });
		this.tryEnsureIndex({ 'default': 1 });
		this.tryEnsureIndex({ 'usernames': 1 });
		this.tryEnsureIndex({ 't': 1 });
		this.tryEnsureIndex({ 'u._id': 1 });

		this.cache.ignoreUpdatedFields = ['msgs', 'lm'];
		this.cache.ensureIndex(['t', 'name'], 'unique');
		this.cache.options = {fields: {usernames: 0}};
	}

	findOneByIdOrName(_idOrName, options) {
		const query = {
			$or: [{
				_id: _idOrName
			}, {
				name: _idOrName
			}]
		};

		return this.findOne(query, options);
	}

	findOneByImportId(_id, options) {
		const query = {importIds: _id};

		return this.findOne(query, options);
	}

	findOneByName(name, options) {
		const query = {name};

		return this.findOne(query, options);
	}

	findOneByNameAndNotId(name, rid) {
		const query = {
			_id: { $ne: rid },
			name
		};

		return this.findOne(query);
	}

	findOneByDisplayName(fname, options) {
		const query = {fname};

		return this.findOne(query, options);
	}

	findOneByNameAndType(name, type, options) {
		const query = {
			name,
			t: type
		};

		return this.findOne(query, options);
	}

	findOneByIdContainingUsername(_id, username, options) {
		const query = {
			_id,
			usernames: username
		};

		return this.findOne(query, options);
	}

	findOneByNameAndTypeNotContainingUsername(name, type, username, options) {
		const query = {
			name,
			t: type,
			usernames: {
				$ne: username
			}
		};

		return this.findOne(query, options);
	}


	// FIND

	findById(roomId, options) {
		return this.find({ _id: roomId }, options);
	}

	findByIds(roomIds, options) {
		return this.find({ _id: {$in: [].concat(roomIds)} }, options);
	}

	findByType(type, options) {
		const query = {t: type};

		return this.find(query, options);
	}

	findByTypes(types, options) {
		const query = {
			t: {
				$in: types
			}
		};

		return this.find(query, options);
	}

	findByUserId(userId, options) {
		const query = {'u._id': userId};

		return this.find(query, options);
	}

	findBySubscriptionUserId(userId, options) {
		let data;
		if (this.useCache) {
			data = RocketChat.models.Subscriptions.findByUserId(userId).fetch();
			data = data.map(function(item) {
				if (item._room) {
					return item._room;
				}
				console.log('Empty Room for Subscription', item);
			});
			data = data.filter(item => item);
			return this.arrayToCursor(this.processQueryOptionsOnResult(data, options));
		}

		data = RocketChat.models.Subscriptions.findByUserId(userId, {fields: {rid: 1}}).fetch();
		data = data.map(item => item.rid);

		const query = {
			_id: {
				$in: data
			}
		};

		return this.find(query, options);
	}

	findBySubscriptionUserIdUpdatedAfter(userId, _updatedAt, options) {
		if (this.useCache) {
			let data = RocketChat.models.Subscriptions.findByUserId(userId).fetch();
			data = data.map(function(item) {
				if (item._room) {
					return item._room;
				}
				console.log('Empty Room for Subscription', item);
			});
			data = data.filter(item => item && item._updatedAt > _updatedAt);
			return this.arrayToCursor(this.processQueryOptionsOnResult(data, options));
		}

		let ids = RocketChat.models.Subscriptions.findByUserId(userId, {fields: {rid: 1}}).fetch();
		ids = ids.map(item => item.rid);

		const query = {
			_id: {
				$in: ids
			},
			_updatedAt: {
				$gt: _updatedAt
			}
		};

		return this.find(query, options);
	}

	findByNameContaining(name, options) {
		const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');

		const query = {
			$or: [
				{name: nameRegex},
				{
					t: 'd',
					usernames: nameRegex
				}
			]
		};

		return this.find(query, options);
	}

	findByNameContainingTypesWithUsername(name, types, options) {
		const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');

		const $or = [];
		for (const type of Array.from(types)) {
			const obj = {name: nameRegex, t: type.type};
			if (type.username != null) {
				obj.usernames = type.username;
			}
			if (type.ids != null) {
				obj._id = {$in: type.ids};
			}
			$or.push(obj);
		}

		const query = {$or};

		return this.find(query, options);
	}

	findContainingTypesWithUsername(types, options) {

		const $or = [];
		for (const type of Array.from(types)) {
			const obj = {t: type.type};
			if (type.username != null) {
				obj.usernames = type.username;
			}
			if (type.ids != null) {
				obj._id = {$in: type.ids};
			}
			$or.push(obj);
		}

		const query = {$or};

		return this.find(query, options);
	}

	findByNameContainingAndTypes(name, types, options) {
		const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');

		const query = {
			t: {
				$in: types
			},
			$or: [
				{name: nameRegex},
				{
					t: 'd',
					usernames: nameRegex
				}
			]
		};

		return this.find(query, options);
	}

	findByNameAndTypeNotDefault(name, type, options) {
		const query = {
			t: type,
			name,
			default: {
				$ne: true
			}
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findByNameAndTypesNotContainingUsername(name, types, username, options) {
		const query = {
			t: {
				$in: types
			},
			name,
			usernames: {
				$ne: username
			}
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findByNameStartingAndTypes(name, types, options) {
		const nameRegex = new RegExp(`^${ s.trim(s.escapeRegExp(name)) }`, 'i');

		const query = {
			t: {
				$in: types
			},
			$or: [
				{name: nameRegex},
				{
					t: 'd',
					usernames: nameRegex
				}
			]
		};

		return this.find(query, options);
	}

	findByDefaultAndTypes(defaultValue, types, options) {
		const query = {
			default: defaultValue,
			t: {
				$in: types
			}
		};

		return this.find(query, options);
	}

	findByTypeContainingUsername(type, username, options) {
		const query = {
			t: type,
			usernames: username
		};

		return this.find(query, options);
	}

	findByTypeContainingUsernames(type, username, options) {
		const query = {
			t: type,
			usernames: { $all: [].concat(username) }
		};

		return this.find(query, options);
	}

	findByTypesAndNotUserIdContainingUsername(types, userId, username, options) {
		const query = {
			t: {
				$in: types
			},
			uid: {
				$ne: userId
			},
			usernames: username
		};

		return this.find(query, options);
	}

	findByContainingUsername(username, options) {
		const query = {usernames: username};

		return this.find(query, options);
	}

	findByTypeAndName(type, name, options) {
		if (this.useCache) {
			return this.cache.findByIndex('t,name', [type, name], options);
		}

		const query = {
			name,
			t: type
		};

		return this.find(query, options);
	}

	findByTypeAndNameContainingUsername(type, name, username, options) {
		const query = {
			name,
			t: type,
			usernames: username
		};

		return this.find(query, options);
	}

	findByTypeAndArchivationState(type, archivationstate, options) {
		const query = {t: type};

		if (archivationstate) {
			query.archived = true;
		} else {
			query.archived = { $ne: true };
		}

		return this.find(query, options);
	}

	// UPDATE
	addImportIds(_id, importIds) {
		importIds = [].concat(importIds);
		const query = {_id};

		const update = {
			$addToSet: {
				importIds: {
					$each: importIds
				}
			}
		};

		return this.update(query, update);
	}

	archiveById(_id) {
		const query = {_id};

		const update = {
			$set: {
				archived: true
			}
		};

		return this.update(query, update);
	}

	unarchiveById(_id) {
		const query = {_id};

		const update = {
			$set: {
				archived: false
			}
		};

		return this.update(query, update);
	}

	addUsernameById(_id, username, muted) {
		const query = {_id};

		const update = {
			$addToSet: {
				usernames: username
			}
		};

		if (muted) {
			update.$addToSet.muted = username;
		}

		return this.update(query, update);
	}

	addUsernamesById(_id, usernames) {
		const query = {_id};

		const update = {
			$addToSet: {
				usernames: {
					$each: usernames
				}
			}
		};

		return this.update(query, update);
	}

	addUsernameByName(name, username) {
		const query = {name};

		const update = {
			$addToSet: {
				usernames: username
			}
		};

		return this.update(query, update);
	}

	removeUsernameById(_id, username) {
		const query = {_id};

		const update = {
			$pull: {
				usernames: username
			}
		};

		return this.update(query, update);
	}

	removeUsernamesById(_id, usernames) {
		const query = {_id};

		const update = {
			$pull: {
				usernames: {
					$in: usernames
				}
			}
		};

		return this.update(query, update);
	}

	removeUsernameFromAll(username) {
		const query = {usernames: username};

		const update = {
			$pull: {
				usernames: username
			}
		};

		return this.update(query, update, { multi: true });
	}

	removeUsernameByName(name, username) {
		const query = {name};

		const update = {
			$pull: {
				usernames: username
			}
		};

		return this.update(query, update);
	}

	setNameById(_id, name, fname) {
		const query = {_id};

		const update = {
			$set: {
				name,
				fname
			}
		};

		return this.update(query, update);
	}

	incMsgCountById(_id, inc) {
		if (inc == null) { inc = 1; }
		const query = {_id};

		const update = {
			$inc: {
				msgs: inc
			}
		};

		return this.update(query, update);
	}

	incMsgCountAndSetLastMessageById(_id, inc, lastMessageTimestamp, lastMessage) {
		if (inc == null) { inc = 1; }
		const query = {_id};

		const update = {
			$set: {
				lm: lastMessageTimestamp
			},
			$inc: {
				msgs: inc
			}
		};

		if (lastMessage) {
			update.$set.lastMessage = lastMessage;
		}

		return this.update(query, update);
	}

	setLastMessageById(_id, lastMessage) {
		const query = {_id};

		const update = {
			$set: {
				lastMessage
			}
		};

		return this.update(query, update);
	}

	replaceUsername(previousUsername, username) {
		const query = {usernames: previousUsername};

		const update = {
			$set: {
				'usernames.$': username
			}
		};

		return this.update(query, update, { multi: true });
	}

	replaceMutedUsername(previousUsername, username) {
		const query = {muted: previousUsername};

		const update = {
			$set: {
				'muted.$': username
			}
		};

		return this.update(query, update, { multi: true });
	}

	replaceUsernameOfUserByUserId(userId, username) {
		const query = {'u._id': userId};

		const update = {
			$set: {
				'u.username': username
			}
		};

		return this.update(query, update, { multi: true });
	}

	setJoinCodeById(_id, joinCode) {
		let update;
		const query = {_id};

		if ((joinCode != null ? joinCode.trim() : undefined) !== '') {
			update = {
				$set: {
					joinCodeRequired: true,
					joinCode
				}
			};
		} else {
			update = {
				$set: {
					joinCodeRequired: false
				},
				$unset: {
					joinCode: 1
				}
			};
		}

		return this.update(query, update);
	}

	setUserById(_id, user) {
		const query = {_id};

		const update = {
			$set: {
				u: {
					_id: user._id,
					username: user.username
				}
			}
		};

		return this.update(query, update);
	}

	setTypeById(_id, type) {
		const query = {_id};
		const update = {
			$set: {
				t: type
			}
		};
		if (type === 'p') {
			update.$unset = {default: ''};
		}

		return this.update(query, update);
	}

	setTopicById(_id, topic) {
		const query = {_id};

		const update = {
			$set: {
				topic
			}
		};

		return this.update(query, update);
	}

	setAnnouncementById(_id, announcement) {
		const query = {_id};

		const update = {
			$set: {
				announcement
			}
		};

		return this.update(query, update);
	}

	muteUsernameByRoomId(_id, username) {
		const query = {_id};

		const update = {
			$addToSet: {
				muted: username
			}
		};

		return this.update(query, update);
	}

	unmuteUsernameByRoomId(_id, username) {
		const query = {_id};

		const update = {
			$pull: {
				muted: username
			}
		};

		return this.update(query, update);
	}

	saveDefaultById(_id, defaultValue) {
		const query = {_id};

		const update = {
			$set: {
				default: defaultValue === 'true'
			}
		};

		return this.update(query, update);
	}

	setTopicAndTagsById(_id, topic, tags) {
		const setData = {};
		const unsetData = {};

		if (topic != null) {
			if (!_.isEmpty(s.trim(topic))) {
				setData.topic = s.trim(topic);
			} else {
				unsetData.topic = 1;
			}
		}

		if (tags != null) {
			if (!_.isEmpty(s.trim(tags))) {
				setData.tags = s.trim(tags).split(',').map(tag => s.trim(tag));
			} else {
				unsetData.tags = 1;
			}
		}

		const update = {};

		if (!_.isEmpty(setData)) {
			update.$set = setData;
		}

		if (!_.isEmpty(unsetData)) {
			update.$unset = unsetData;
		}

		if (_.isEmpty(update)) {
			return;
		}

		return this.update({ _id }, update);
	}

	// INSERT
	createWithTypeNameUserAndUsernames(type, name, fname, user, usernames, extraData) {
		const room = {
			name,
			fname,
			t: type,
			usernames,
			msgs: 0,
			u: {
				_id: user._id,
				username: user.username
			}
		};

		_.extend(room, extraData);

		room._id = this.insert(room);
		return room;
	}

	createWithIdTypeAndName(_id, type, name, extraData) {
		const room = {
			_id,
			ts: new Date(),
			t: type,
			name,
			usernames: [],
			msgs: 0
		};

		_.extend(room, extraData);

		this.insert(room);
		return room;
	}


	// REMOVE
	removeById(_id) {
		const query = {_id};

		return this.remove(query);
	}

	removeByTypeContainingUsername(type, username) {
		const query = {
			t: type,
			usernames: username
		};

		return this.remove(query);
	}
}

RocketChat.models.Rooms = new ModelRooms('room', true);
