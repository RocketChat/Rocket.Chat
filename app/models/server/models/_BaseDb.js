import { EventEmitter } from 'events';

import { Match } from 'meteor/check';
import { Mongo, MongoInternals } from 'meteor/mongo';
import _ from 'underscore';

const baseName = 'rocketchat_';

const trash = new Mongo.Collection(`${ baseName }_trash`);
try {
	trash._ensureIndex({ collection: 1 });
	trash._ensureIndex(
		{ _deletedAt: 1 },
		{ expireAfterSeconds: 60 * 60 * 24 * 30 }
	);
} catch (e) {
	console.log(e);
}

export class BaseDb extends EventEmitter {
	constructor(model, baseModel) {
		super();

		if (Match.test(model, String)) {
			this.name = model;
			this.collectionName = this.baseName + this.name;
			this.model = new Mongo.Collection(this.collectionName);
		} else {
			this.name = model._name;
			this.collectionName = this.name;
			this.model = model;
		}

		this.baseModel = baseModel;

		this.wrapModel();

		// When someone start listening for changes we start oplog if available
		const handleListener = (event /* , listener*/) => {
			if (event !== 'change') {
				return;
			}

			this.removeListener('newListener', handleListener);

			const query = {
				collection: this.collectionName,
			};

			if (!MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle) {
				throw new Error(`Error: Unable to find Mongodb Oplog. You must run the server with oplog enabled. Try the following:\n
				1. Start your mongodb in a replicaset mode: mongod --smallfiles --oplogSize 128 --replSet rs0\n
				2. Start the replicaset via mongodb shell: mongo mongo/meteor --eval "rs.initiate({ _id: ''rs0'', members: [ { _id: 0, host: ''localhost:27017'' } ]})"\n
				3. Start your instance with OPLOG configuration: export MONGO_OPLOG_URL=mongodb://localhost:27017/local MONGO_URL=mongodb://localhost:27017/meteor node main.js
				`);
			}

			MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle.onOplogEntry(
				query,
				this.processOplogRecord.bind(this)
			);
			// Meteor will handle if we have a value https://github.com/meteor/meteor/blob/5dcd0b2eb9c8bf881ffbee98bc4cb7631772c4da/packages/mongo/oplog_tailing.js#L5
			if (process.env.METEOR_OPLOG_TOO_FAR_BEHIND == null) {
				MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle._defineTooFarBehind(
					Number.MAX_SAFE_INTEGER
				);
			}
		};
		this.on('newListener', handleListener);

		this.tryEnsureIndex({ _updatedAt: 1 });
	}

	get baseName() {
		return baseName;
	}

	setUpdatedAt(record = {}) {
		// TODO: Check if this can be deleted, Rodrigo does not rememebr WHY he added it. So he removed it to fix issue #5541
		// setUpdatedAt(record = {}, checkQuery = false, query) {
		// if (checkQuery === true) {
		// 	if (!query || Object.keys(query).length === 0) {
		// 		throw new Meteor.Error('Models._Base: Empty query');
		// 	}
		// }

		if (/(^|,)\$/.test(Object.keys(record).join(','))) {
			record.$set = record.$set || {};
			record.$set._updatedAt = new Date();
		} else {
			record._updatedAt = new Date();
		}

		return record;
	}

	wrapModel() {
		this.originals = {
			insert: this.model.insert.bind(this.model),
			update: this.model.update.bind(this.model),
			remove: this.model.remove.bind(this.model),
		};
		const self = this;

		this.model.insert = function(...args) {
			return self.insert(...args);
		};

		this.model.update = function(...args) {
			return self.update(...args);
		};

		this.model.remove = function(...args) {
			return self.remove(...args);
		};
	}

	_doNotMixInclusionAndExclusionFields(options) {
		if (options && options.fields) {
			const keys = Object.keys(options.fields);
			const removeKeys = keys.filter((key) => options.fields[key] === 0);
			if (keys.length > removeKeys.length) {
				removeKeys.forEach((key) => delete options.fields[key]);
			}
		}
	}

	find(...args) {
		this._doNotMixInclusionAndExclusionFields(args[1]);
		return this.model.find(...args);
	}

	findOne(...args) {
		this._doNotMixInclusionAndExclusionFields(args[1]);
		return this.model.findOne(...args);
	}

	findOneById(_id, options) {
		return this.findOne({ _id }, options);
	}

	findOneByIds(ids, options) {
		return this.findOne({ _id: { $in: ids } }, options);
	}

	updateHasPositionalOperator(update) {
		return Object.keys(update).some(
			(key) =>
				key.includes('.$')
				|| (Match.test(update[key], Object)
					&& this.updateHasPositionalOperator(update[key]))
		);
	}

	processOplogRecord(action) {
		if (action.op.op === 'i') {
			this.emit('change', {
				action: 'insert',
				clientAction: 'inserted',
				id: action.op.o._id,
				data: action.op.o,
				oplog: true,
			});
			return;
		}

		if (action.op.op === 'u') {
			if (!action.op.o.$set && !action.op.o.$unset) {
				this.emit('change', {
					action: 'update',
					clientAction: 'updated',
					id: action.id,
					data: action.op.o,
					oplog: true,
				});
				return;
			}

			const diff = {};
			if (action.op.o.$set) {
				for (const key in action.op.o.$set) {
					if (action.op.o.$set.hasOwnProperty(key)) {
						diff[key] = action.op.o.$set[key];
					}
				}
			}

			if (action.op.o.$unset) {
				for (const key in action.op.o.$unset) {
					if (action.op.o.$unset.hasOwnProperty(key)) {
						diff[key] = undefined;
					}
				}
			}

			this.emit('change', {
				action: 'update',
				clientAction: 'updated',
				id: action.id,
				diff,
				oplog: true,
			});
			return;
		}

		if (action.op.op === 'd') {
			this.emit('change', {
				action: 'remove',
				clientAction: 'removed',
				id: action.id,
				oplog: true,
			});
		}
	}

	insert(record, ...args) {
		this.setUpdatedAt(record);

		const result = this.originals.insert(record, ...args);

		record._id = result;

		return result;
	}

	update(query, update, options = {}) {
		this.setUpdatedAt(update, true, query);

		return this.originals.update(query, update, options);
	}

	upsert(query, update, options = {}) {
		options.upsert = true;
		options._returnObject = true;
		return this.update(query, update, options);
	}

	remove(query) {
		const records = this.model.find(query).fetch();

		const ids = [];
		for (const record of records) {
			ids.push(record._id);

			record._deletedAt = new Date();
			record.__collection__ = this.name;

			trash.upsert({ _id: record._id }, _.omit(record, '_id'));
		}

		query = { _id: { $in: ids } };

		return this.originals.remove(query);
	}

	insertOrUpsert(...args) {
		if (args[0] && args[0]._id) {
			const { _id } = args[0];
			delete args[0]._id;
			args.unshift({
				_id,
			});

			this.upsert(...args);
			return _id;
		}
		return this.insert(...args);
	}

	allow(...args) {
		return this.model.allow(...args);
	}

	deny(...args) {
		return this.model.deny(...args);
	}

	ensureIndex(...args) {
		return this.model._ensureIndex(...args);
	}

	dropIndex(...args) {
		return this.model._dropIndex(...args);
	}

	tryEnsureIndex(...args) {
		try {
			return this.ensureIndex(...args);
		} catch (e) {
			console.error('Error creating index:', this.name, '->', ...args, e);
		}
	}

	tryDropIndex(...args) {
		try {
			return this.dropIndex(...args);
		} catch (e) {
			console.error('Error dropping index:', this.name, '->', ...args, e);
		}
	}

	trashFind(query, options) {
		query.__collection__ = this.name;

		return trash.find(query, options);
	}

	trashFindOneById(_id, options) {
		const query = {
			_id,
			__collection__: this.name,
		};

		return trash.findOne(query, options);
	}

	trashFindDeletedAfter(deletedAt, query = {}, options) {
		query.__collection__ = this.name;
		query._deletedAt = {
			$gt: deletedAt,
		};

		return trash.find(query, options);
	}
}
