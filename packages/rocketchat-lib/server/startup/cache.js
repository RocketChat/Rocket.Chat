/* globals loki */
/* eslint new-cap: false */

const objectPath = Npm.require("object-path");

class Adapter {
	loadDatabase(dbname, callback) {}
	saveDatabase(dbname, dbstring, callback) {}
	deleteDatabase(dbname, callback) {}
}

class Cache {
	constructor() {
		this.db = new loki('rocket.chat.json', {adapter: Adapter});
	}

	registerCollection(collection) {
		this[collection] = this.db.addCollection(collection);
		this.loadCollection(collection);
		this.startOplogForCollection(collection);
	}

	loadCollection(collection) {
		console.time(`Load ${collection}`);
		this[collection].insert(RocketChat.models[collection].find().fetch());
		console.timeEnd(`Load ${collection}`);
	}

	startOplogForCollection(collection) {
		const query = {
			collection: RocketChat.models[collection].model._name
		}

		MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle.onOplogEntry(query, (record) => {
			this.processOplogRecordForCollection(collection, record);
		});
	}

	processOplogRecordForCollection(collection, action) {
		// console.log(collection, JSON.stringify(action, null, 2));
		if (action.op.op === 'i') {
			this[collection].insert(action.op.o);
			return;
		}

		if (action.op.op === 'u') {
			const record = this[collection].findOne({_id: action.id});

			if (action.op.o.$set) {
				for (let key in action.op.o.$set) {
					objectPath.set(record, key, action.op.o.$set[key]);
				}
			}

			if (action.op.o.$unset) {
				for (let key in action.op.o.$unset) {
					objectPath.set(record, key, null);
				}
			}

			this[collection].update(record);
			return;
		}

		if (action.op.op === 'd') {
			this[collection].removeWhere({_id: action.id});
			return;
		}
	}
}

RocketChat.cache = new Cache;

RocketChat.cache.registerCollection('Users');
RocketChat.cache.registerCollection('Rooms');
RocketChat.cache.registerCollection('Subscriptions');

console.time('Join');
RocketChat.cache.Rooms.find().forEach((room) => {
	room.usernames = [];
});

RocketChat.cache.Subscriptions.find().forEach((subscription) => {
	const room = RocketChat.cache.Rooms.findOne({_id: subscription.rid});
	if (!room) {
		console.log('No room for', subscription.rid);
		return
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
