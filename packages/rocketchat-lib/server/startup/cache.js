/* globals loki, MongoInternals */
/* eslint new-cap: 0 */

RocketChat.cache = {};

const objectPath = Npm.require('object-path');

class Adapter {
	loadDatabase(/*dbname, callback*/) {}
	saveDatabase(/*dbname, dbstring, callback*/) {}
	deleteDatabase(/*dbname, callback*/) {}
}

const db = new loki('rocket.chat.json', {adapter: Adapter});

RocketChat.cache._Base = (class CacheBase {
	constructor(collectionName) {
		this.db = db;
		this.collectionName = collectionName;
		this.register();
	}

	register() {
		this.model = RocketChat.models[this.collectionName];
		this.collection = this.db.addCollection(this.collectionName);
		this.load();
		this.startOplog();
	}

	load() {
		console.time(`Load ${this.collectionName}`);
		this.collection.insert(this.model.find().fetch());
		console.timeEnd(`Load ${this.collectionName}`);
	}

	startOplog() {
		const query = {
			collection: this.model.model._name
		};

		MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle.onOplogEntry(query, (record) => {
			this.processOplogRecord(record);
		});
	}

	processOplogRecord(action) {
		// console.log(this.collectionName, JSON.stringify(action, null, 2));
		if (action.op.op === 'i') {
			this.collection.insert(action.op.o);
			return;
		}

		if (action.op.op === 'u') {
			const record = this.collection.findOne({_id: action.id});

			if (action.op.o.$set) {
				for (let key in action.op.o.$set) {
					if (action.op.o.$set.hasOwnProperty(key)) {
						objectPath.set(record, key, action.op.o.$set[key]);
					}
				}
			}

			if (action.op.o.$unset) {
				for (let key in action.op.o.$unset) {
					if (action.op.o.$set.hasOwnProperty(key)) {
						objectPath.set(record, key, null);
					}
				}
			}

			this.collection.update(record);
			return;
		}

		if (action.op.op === 'd') {
			this.collection.removeWhere({_id: action.id});
			return;
		}
	}

	find(...findArguments) {
		return {
			fetch() {
				return this.collection.find(...findArguments);
			},

			count() {
				return this.collection.find(...findArguments).length;
			},

			forEach(fn) {
				return this.collection.find(...findArguments).forEach(fn);
			}
		};
	}

	findOne() {
		return this.collection.findOne(...arguments);
	}

	findWhere() {
		return this.collection.findWhere(...arguments);
	}

	addDynamicView() {
		return this.collection.addDynamicView(...arguments);
	}

	getDynamicView() {
		return this.collection.getDynamicView(...arguments);
	}
});

RocketChat.cache.Users = new (class CacheUser extends RocketChat.cache._Base {
	constructor() {
		super('Users');
	}
});

RocketChat.cache.Rooms = new (class CacheUser extends RocketChat.cache._Base {
	constructor() {
		super('Rooms');
	}

	// FIND ONE
	findOneById(_id, options) {
		const query = {
			_id: _id
		};

		return this.findOne(query, options);
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
		const query = {
			importIds: _id
		};

		return this.findOne(query, options);
	}

	findOneByName(name, options) {
		const query = {
			name: name
		};

		return this.findOne(query, options);
	}

	findOneByNameAndType(name, type, options) {
		const query = {
			name: name,
			t: type
		};

		return this.findOne(query, options);
	}

	findOneByIdContainigUsername(_id, username, options) {
		const query = {
			_id: _id,
			usernames: username
		};

		return this.findOne(query, options);
	}

	findOneByNameAndTypeNotContainigUsername(name, type, username, options) {
		const query = {
			name: name,
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
		const query = {
			t: type
		};

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
		const query = {
			'u._id': userId
		};

		return this.find(query, options);
	}

	findByNameContaining(name, options) {
		const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');

		const query = {
			$or: [{
				name: nameRegex
			}, {
				t: 'd',
				usernames: nameRegex
			}]
		};

		return this.find(query, options);
	}

	findByNameContainingTypesWithUsername(name, types, options) {
		const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');

		const $or = [];
		types.forEach((type) => {
			const obj = {name: nameRegex, t: type.type};
			if (type.username) {
				obj.usernames = type.username;
			}

			if (type.ids) {
				obj._id = {
					$in: type.ids
				};
			}
			$or.push(obj);
		});

		const query = {
			$or: $or
		};

		return this.find(query, options);
	}

	findContainingTypesWithUsername(types, options) {
		const $or = [];

		types.forEach((type) => {
			const obj = {t: type.type};
			if (type.username) {
				obj.usernames = type.username;
			}

			if (type.ids) {
				obj._id = {
					$in: type.ids
				};
			}

			$or.push(obj);
		});

		const query = {
			$or: $or
		};

		return this.find(query, options);
	}

	findByNameContainingAndTypes(name, types, options) {
		const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');

		const query = {
			t: {
				$in: types
			},
			$or: [{
				name: nameRegex
			}, {
				t: 'd',
				usernames: nameRegex
			}]
		};

		return this.find(query, options);
	}

	findByNameStartingAndTypes(name, types, options) {
		const nameRegex = new RegExp('^' + s.trim(s.escapeRegExp(name)), 'i');

		const query = {
			t: {
				$in: types
			},
			$or: [{
				name: nameRegex
			}, {
				t: 'd',
				usernames: nameRegex
			}]
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

	findByTypeContainigUsername(type, username, options) {
		const query = {
			t: type,
			usernames: username
		};

		return this.find(query, options);
	}

	findByTypeContainigUsernames(type, username, options) {
		const query = {
			t: type,
			usernames: {
				$all: [].concat(username)
			}
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

	findByContainigUsername(username, options) {
		const query = {
			usernames: username
		};

		return this.find(query, options);
	}

	findByTypeAndName(type, name, options) {
		const query = {
			name: name,
			t: type
		};

		return this.find(query, options);
	}

	findByTypeAndNameContainingUsername(type, name, username, options) {
		const query = {
			name: name,
			t: type,
			usernames: username
		};

		return this.find(query, options);
	}

	findByTypeAndArchivationState(type, archivationstate, options) {
		const query = {
			t: type
		};

		if (archivationstate) {
			query.archived = true;
		} else {
			query.archived = {
				$ne: true
			};
		}

		return this.find(query, options);
	}

});

RocketChat.cache.Subscriptions = new (class CacheUser extends RocketChat.cache._Base {
	constructor() {
		super('Subscriptions');
	}
});
// RocketChat.cache = new Cache;

// RocketChat.cache.registerCollection('Users');
// RocketChat.cache.registerCollection('Rooms');
// RocketChat.cache.registerCollection('Subscriptions');

console.time('Join');
RocketChat.cache.Rooms.find().forEach((room) => {
	room.usernames = [];
});

RocketChat.cache.Subscriptions.find().forEach((subscription) => {
	const room = RocketChat.cache.Rooms.findOne({_id: subscription.rid});
	if (!room) {
		console.log('No room for', subscription.rid);
		return;
	}
	room.usernames.push(subscription.u.username);
});
console.timeEnd('Join');

RocketChat.cache.Users.addDynamicView('highlights').applyFind({
	'settings.preferences.highlights': {$size: {$gt: 0}}
});
RocketChat.cache.Subscriptions.addDynamicView('notifications').applyFind({
	$or: [
		{desktopNotifications: {$in: ['all', 'nothing']}},
		{mobilePushNotifications: {$in: ['all', 'nothing']}}
	]
});
