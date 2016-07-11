/* globals loki, MongoInternals */
/* eslint new-cap: 0 */

const ignore = [
	'emit',
	'load',
	'on',
	'addToAllIndexes'
];

function traceMethodCalls(target) {
	target._stats = {};

	for (const property in target) {
		if (typeof target[property] === 'function' && ignore.indexOf(property) === -1) {
			target._stats[property] = {
				calls: 0,
				time: 0,
				avg: 0
			};
			const origMethod = target[property];
			target[property] = function(...args) {

				if (target.loaded !== true) {
					return origMethod.apply(target, args);
				}

				const startTime = RocketChat.statsTracker.now();
				const result = origMethod.apply(target, args);
				const time = Math.round(RocketChat.statsTracker.now() - startTime) / 1000;
				target._stats[property].time += time;
				target._stats[property].calls++;
				target._stats[property].avg = target._stats[property].time / target._stats[property].calls;

				return result;
			};
		}
	}

	setInterval(function() {
		for (const property in target._stats) {
			if (target._stats.hasOwnProperty(property) && target._stats[property].time > 0) {
				const tags = [`property:${property}`, `collection:${target.collectionName}`];
				RocketChat.statsTracker.timing('cache.methods.time', target._stats[property].avg, tags);
				RocketChat.statsTracker.increment('cache.methods.totalTime', target._stats[property].time, tags);
				RocketChat.statsTracker.increment('cache.methods.count', target._stats[property].calls, tags);
				target._stats[property].avg = 0;
				target._stats[property].time = 0;
				target._stats[property].calls = 0;
			}
		}
	}, 10000);

	target._getStatsAvg = function() {
		const stats = [];
		for (const property in target._stats) {
			if (target._stats.hasOwnProperty(property)) {
				stats.push([Math.round(target._stats[property].avg*100)/100, property]);
			}
		}
		return _.sortBy(stats, function(record) {
			return record[0];
		});
	};
}

const {EventEmitter} = Npm.require('events');

RocketChat.cache = {};

const objectPath = Npm.require('object-path');

class Adapter {
	loadDatabase(/*dbname, callback*/) {}
	saveDatabase(/*dbname, dbstring, callback*/) {}
	deleteDatabase(/*dbname, callback*/) {}
}

const db = new loki('rocket.chat.json', {adapter: Adapter});

RocketChat.cache._Base = (class CacheBase extends EventEmitter {
	constructor(collectionName) {
		super();

		traceMethodCalls(this);

		this.indexes = {
			_id: {type: 'unique'}
		};

		this.joins = {};

		this.db = db;
		this.collectionName = collectionName;
		this.register();
		this.initJoins();
	}

	initJoins() {
		for (const field in this.joins) {
			if (this.joins.hasOwnProperty(field)) {
				const join = this.joins[field];

				if (!RocketChat.cache[join.join]) {
					console.log(`Invalid cache model ${join.join}`);
					continue;
				}

				RocketChat.cache[join.join].on('inserted', (record) => {
					this.processRemoteJoinInserted(field, join, record);
				});

				// RocketChat.cache[join.join].on('updated', (record) => {

				// });

				// RocketChat.cache[join.join].on('removed', (record) => {

				// });

				this.on('inserted', (record) => {
					this.processLocalJoinInserted(field, join, record);
				});
			}
		}
	}

	processRemoteJoinInserted(field, join, record) {
		let localRecords = this.findByIndex(join.field, record[join.joinField]);

		if (!localRecords) {
			return;
		}

		if (!Array.isArray(localRecords)) {
			localRecords = [localRecords];
		}

		for (var i = 0; i < localRecords.length; i++) {
			const localRecord = localRecords[i];
			if (join.multi === true && !localRecord[field]) {
				localRecord[field] = [];
			}

			if (typeof join.transform === 'function') {
				record = join.transform(localRecord, record);
			}

			if (join.multi === true) {
				localRecord[field].push(record);
			} else {
				localRecord[field] = record;
			}

			this.emit(`join:${field}:${localRecord._id}:inserted`, record);
		}
	}

	processLocalJoinInserted(field, join, localRecord) {
		let records = RocketChat.cache[join.join].findByIndex(join.joinField, localRecord[join.field]);

		if (!Array.isArray(records)) {
			records = [records];
		}

		for (let i = 0; i < records.length; i++) {
			let record = records[i];

			if (typeof join.transform === 'function') {
				record = join.transform(localRecord, record);
			}

			if (join.multi === true) {
				localRecord[field].push(record);
			} else {
				localRecord[field] = record;
			}

			this.emit(`join:${field}:${localRecord._id}:inserted`, record);
		}
	}

	addToAllIndexes(record) {
		for (const index in this.indexes) {
			if (this.indexes.hasOwnProperty(index)) {
				this.addToIndex(index, record);
			}
		}
	}

	addToIndex(index, record) {
		if (!this.indexes[index]) {
			console.error(`Index not defined ${index}`);
			return;
		}

		if (!this.indexes[index].data) {
			this.indexes[index].data = {};
		}

		if (this.indexes[index].type === 'unique') {
			this.indexes[index].data[record[index]] = record;
			return;
		}

		if (this.indexes[index].type === 'array') {
			if (!this.indexes[index].data[record[index]]) {
				this.indexes[index].data[record[index]] = [];
			}
			this.indexes[index].data[record[index]].push(record);
			return;
		}
	}

	findByIndex(index, key) {
		if (!this.indexes[index]) {
			return;
		}

		if (this.indexes[index].data) {
			const result = this.indexes[index].data[key];
			if (result) {
				return result;
			}
		}

		if (this.indexes[index].type === 'array') {
			return [];
		}
	}

	register() {
		this.model = RocketChat.models[this.collectionName];
		this.collection = this.db.addCollection(this.collectionName);
		// this.load();
	}

	load() {
		// this.initJoins();
		this.emit('beforeload');
		this.loaded = false;
		const time = RocketChat.statsTracker.now();
		const data = this.model.find().fetch();
		for (let i=0; i < data.length; i++) {
			this.addToAllIndexes(data[i]);
			// this.recordsById[data[i]._id] = data[i];
			this.insert(data[i]);
		}
		RocketChat.statsTracker.timing('cache.load', RocketChat.statsTracker.now() - time, [`collection:${this.collectionName}`]);
		this.startOplog();
		this.loaded = true;
		this.emit('afterload');
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
			fetch: () => {
				return this.collection.find(...findArguments);
			},

			count: () => {
				return this.collection.find(...findArguments).length;
			},

			forEach: (fn) => {
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

	insert(record) {
		if (Array.isArray(record)) {
			for (let i=0; i < record.length; i++) {
				this.collection.insert(record[i]);
				this.emit('inserted', record[i]);
			}
		} else {
			this.collection.insert(record);
			this.emit('inserted', record);
		}
	}
});
