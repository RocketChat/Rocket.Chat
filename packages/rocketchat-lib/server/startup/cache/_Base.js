/* globals loki, MongoInternals */
/* eslint new-cap: 0 */

const {EventEmitter} = Npm.require('events');
const objectPath = Npm.require('object-path');

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

RocketChat.cache = {};

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

		this.indexes = {};
		this.ignoeUpdatedFields = ['_updatedAt'];

		this.query = {};
		this.options = {};

		this.ensureIndex('_id', 'unique');

		this.joins = {};

		this.on('inserted', (...args) => { this.emit('changed', 'inserted', ...args); });
		this.on('removed', (...args) => { this.emit('changed', 'removed', ...args); });
		this.on('updated', (...args) => { this.emit('changed', 'updated', ...args); });

		this.on('beforeinsert', (...args) => { this.emit('beforechange', 'inserted', ...args); });
		this.on('beforeremove', (...args) => { this.emit('beforechange', 'removed', ...args); });
		this.on('beforeupdate', (...args) => { this.emit('beforechange', 'updated', ...args); });

		this.on('inserted', (...args) => { this.emit('sync', 'inserted', ...args); });
		this.on('updated', (...args) => { this.emit('sync', 'removed', ...args); });
		this.on('beforeremove', (...args) => { this.emit('sync', 'updated', ...args); });

		this.db = db;
		this.collectionName = collectionName;
		this.register();
	}

	hasOne(join, {field, link}) {
		this.join({join, field, link, multi: false});
	}

	hasMany(join, {field, link}) {
		this.join({join, field, link, multi: true});
	}

	join({join, field, link, multi}) {
		if (!RocketChat.cache[join]) {
			console.log(`Invalid cache model ${join}`);
			return;
		}

		RocketChat.cache[join].on('inserted', (record) => {
			this.processRemoteJoinInserted({join, field, link, multi, record: record});
		});

		RocketChat.cache[join].on('beforeupdate', (record, diff) => {
			if (diff[link.remote]) {
				this.processRemoteJoinRemoved({join, field, link, multi, record: record});
			}
		});

		RocketChat.cache[join].on('updated', (record, diff) => {
			if (diff[link.remote]) {
				this.processRemoteJoinInserted({join, field, link, multi, record: record});
			}
		});

		RocketChat.cache[join].on('removed', (record) => {
			this.processRemoteJoinRemoved({join, field, link, multi, record: record});
		});

		this.on('inserted', (localRecord) => {
			this.processLocalJoinInserted({join, field, link, multi, localRecord: localRecord});
		});

		this.on('beforeupdate', (localRecord, diff) => {
			if (diff[link.local]) {
				if (multi === true) {
					localRecord[field] = [];
				} else {
					localRecord[field] = undefined;
				}
			}
		});

		this.on('updated', (localRecord, diff) => {
			if (diff[link.local]) {
				this.processLocalJoinInserted({join, field, link, multi, localRecord: localRecord});
			}
		});
	}

	processRemoteJoinInserted({field, link, multi, record}) {
		let localRecords = this.findByIndex(link.local, record[link.remote]);

		if (!localRecords) {
			return;
		}

		if (!Array.isArray(localRecords)) {
			localRecords = [localRecords];
		}

		for (var i = 0; i < localRecords.length; i++) {
			const localRecord = localRecords[i];
			if (multi === true && !localRecord[field]) {
				localRecord[field] = [];
			}

			if (typeof link.transform === 'function') {
				record = link.transform(localRecord, record);
			}

			if (multi === true) {
				localRecord[field].push(record);
			} else {
				localRecord[field] = record;
			}

			this.emit(`join:${field}:inserted`, localRecord, record);
			this.emit(`join:${field}:changed`, 'inserted', localRecord, record);
		}
	}

	processLocalJoinInserted({join, field, link, multi, localRecord}) {
		let records = RocketChat.cache[join].findByIndex(link.remote, localRecord[link.local]);

		if (!Array.isArray(records)) {
			records = [records];
		}

		for (let i = 0; i < records.length; i++) {
			let record = records[i];

			if (typeof link.transform === 'function') {
				record = link.transform(localRecord, record);
			}

			if (multi === true) {
				localRecord[field].push(record);
			} else {
				localRecord[field] = record;
			}

			this.emit(`join:${field}:inserted`, localRecord, record);
			this.emit(`join:${field}:changed`, 'inserted', localRecord, record);
		}
	}

	processRemoteJoinRemoved({field, link, multi, record}) {
		let localRecords = this.findByIndex(link.local, record[link.remote]);

		if (!localRecords) {
			return;
		}

		if (!Array.isArray(localRecords)) {
			localRecords = [localRecords];
		}

		for (var i = 0; i < localRecords.length; i++) {
			const localRecord = localRecords[i];

			if (multi === true) {
				if (Array.isArray(localRecord[field])) {
					if (typeof link.remove === 'function') {
						link.remove(localRecord[field], record);
					} else if (localRecord[field].indexOf(record) > -1) {
						localRecord[field].splice(localRecord[field].indexOf(record), 1);
					}
				}
			} else {
				localRecord[field] = undefined;
			}

			this.emit(`join:${field}:removed`, localRecord, record);
			this.emit(`join:${field}:changed`, 'removed', localRecord, record);
		}
	}

	ensureIndex(fields, type='array') {
		if (!Array.isArray(fields)) {
			fields = [fields];
		}

		this.indexes[fields.join(',')] = {
			type: type,
			fields: fields,
			data: {}
		};
	}

	addToAllIndexes(record) {
		for (const indexName in this.indexes) {
			if (this.indexes.hasOwnProperty(indexName)) {
				this.addToIndex(indexName, record);
			}
		}
	}

	addToIndex(indexName, record) {
		const index = this.indexes[indexName];
		if (!index) {
			console.error(`Index not defined ${indexName}`);
			return;
		}

		let key = [];
		for (const field of index.fields) {
			key.push(objectPath.get(record, field));
		}
		key = key.join('|');

		if (index.type === 'unique') {
			index.data[key] = record;
			return;
		}

		if (index.type === 'array') {
			if (!index.data[key]) {
				index.data[key] = [];
			}
			index.data[key].push(record);
			return;
		}
	}

	removeFromAllIndexes(record) {
		for (const indexName in this.indexes) {
			if (this.indexes.hasOwnProperty(indexName)) {
				this.removeFromIndex(indexName, record);
			}
		}
	}

	removeFromIndex(indexName, record) {
		const index = this.indexes[indexName];
		if (!this.indexes[indexName]) {
			console.error(`Index not defined ${indexName}`);
			return;
		}

		if (!index.data) {
			return;
		}

		let key = [];
		for (const field of index.fields) {
			key.push(objectPath.get(record, field));
		}
		key = key.join('|');

		if (index.type === 'unique') {
			index.data[key] = undefined;
			return;
		}

		if (index.type === 'array') {
			if (!index.data[key]) {
				return;
			}
			const i = index.data[key].indexOf(record);
			if (i > -1) {
				index.data[key].splice(i, 1);
			}
			return;
		}
	}

	findByIndex(index, ...keys) {
		const key = keys.join('|');
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
	}

	load() {
		this.emit('beforeload');
		this.loaded = false;
		const time = RocketChat.statsTracker.now();
		const data = this.model.find(this.query, this.options).fetch();
		for (let i=0; i < data.length; i++) {
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
		// TODO remove - ignore updates in room.usernames
		if (this.collectionName === 'Rooms' && action.op.o.usernames) {
			delete action.op.o.usernames;
		}
		if (this.collectionName === 'Rooms' && action.op.o.$set && action.op.o.$set.usernames) {
			delete action.op.o.$set.usernames;
		}

		if (action.op.op === 'i') {
			this.insert(action.op.o);
			return;
		}

		if (action.op.op === 'u') {
			let diff = {};

			if (!action.op.o.$set && !action.op.o.$set) {
				diff = action.op.o;
			} else {
				if (action.op.o.$set) {
					for (let key in action.op.o.$set) {
						if (action.op.o.$set.hasOwnProperty(key)) {
							diff[key] = action.op.o.$set[key];
						}
					}
				}

				if (action.op.o.$unset) {
					for (let key in action.op.o.$unset) {
						if (action.op.o.$set.hasOwnProperty(key)) {
							diff[key] = undefined;
						}
					}
				}
			}

			this.updateDiffById(action.id, diff);
			return;
		}

		if (action.op.op === 'd') {
			this.removeById(action.id);
			return;
		}
	}

	processQueryOptionsOnResult(result, options={}) {
		if (result === undefined || result === null) {
			return result;
		}

		if (Array.isArray(result)) {
			if (options.sort) {
				result = result.sort((a, b) => {
					let r = 0;
					for (const field in options.sort) {
						if (options.sort.hasOwnProperty(field)) {
							const direction = options.sort[field];
							const valueA = objectPath.get(a, field);
							const valueB = objectPath.get(b, field);
							if (valueA > valueB) {
								r = direction;
								break;
							}
							if (valueA < valueB) {
								r = -direction;
								break;
							}
						}
					}
					return r;
				});
			}

			if (typeof options.limit === 'number') {
				result.splice(options.limit);
			}
		}

		if (!options.fields) {
			options.fields = {
				$loki: 0
			};
		}

		const fieldsToRemove = [];
		const fieldsToGet = [];

		for (const field in options.fields) {
			if (options.fields.hasOwnProperty(field)) {
				if (options.fields[field] === 0) {
					fieldsToRemove.push(field);
				} else if (options.fields[field] === 1) {
					fieldsToGet.push(field);
				}
			}
		}

		if (fieldsToRemove.length > 0 && fieldsToGet.length > 0) {
			console.error('Can\'t mix remove and get fields');
			fieldsToRemove.splice(0, fieldsToRemove.length);
		}

		if (fieldsToGet.length > 0 && fieldsToGet.indexOf('_id') === -1) {
			fieldsToGet.push('_id');
		}

		if (Array.isArray(result)) {
			result = result.map((record) => {
				if (fieldsToRemove.length > 0) {
					return _.omit(record, ...fieldsToRemove);
				}

				if (fieldsToGet.length > 0) {
					return _.pick(record, ...fieldsToGet);
				}
			});
		} else {
			if (fieldsToRemove.length > 0) {
				return _.omit(result, ...fieldsToRemove);
			}

			if (fieldsToGet.length > 0) {
				return _.pick(result, ...fieldsToGet);
			}
		}

		return result;
	}

	processQuery(query) {
		if (!query) {
			return query;
		}

		for (const field in query) {
			if (query.hasOwnProperty(field)) {
				const value = query[field];
				if (value instanceof RegExp) {
					query[field] = {
						$regex: value
					};
				}

				if (field === '$and' || field === '$or') {
					query[field] = value.map((subValue) => {
						return this.processQuery(subValue);
					});
				}
			}
		}

		return query;
	}

	find(query, options={}) {
		query = this.processQuery(query);
		return {
			fetch: () => {
				return this.processQueryOptionsOnResult(this.collection.find(query), options);
			},

			count: () => {
				return this.collection.find(query).length;
			},

			forEach: (fn) => {
				return this.find(query, options).fetch().forEach(fn);
			}
		};
	}

	findOne(query, options) {
		query = this.processQuery(query);
		return this.processQueryOptionsOnResult(this.collection.findOne(query), options);
	}

	findWhere(query, options) {
		query = this.processQuery(query);
		return this.processQueryOptionsOnResult(this.collection.findWhere(query), options);
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
				this.emit('beforeinsert', record[i]);
				this.addToAllIndexes(record[i]);
				this.collection.insert(record[i]);
				this.emit('inserted', record[i]);
			}
		} else {
			this.emit('beforeinsert', record);
			this.addToAllIndexes(record);
			this.collection.insert(record);
			this.emit('inserted', record);
		}
	}

	updateDiffById(id, diff) {
		const record = this.collection.findOne({_id: id});
		const updatedFields = _.without(Object.keys(diff), ...this.ignoeUpdatedFields);

		if (updatedFields.length > 0) {
			this.emit('beforeupdate', record, diff);
		}

		for (let key in diff) {
			if (diff.hasOwnProperty(key)) {
				objectPath.set(record, key, diff[key]);
			}
		}

		this.collection.update(record);

		if (updatedFields.length > 0) {
			this.emit('updated', record, diff);
		}
	}

	removeById(id) {
		const record = this.findByIndex('_id', id);
		if (record) {
			this.emit('beforeremove', record);
			this.collection.removeWhere({_id: id});
			this.removeFromAllIndexes(record);
			this.emit('removed', record);
		}
	}
});
