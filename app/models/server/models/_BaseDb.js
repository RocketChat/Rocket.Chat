import { EventEmitter } from 'events';

import { Match } from 'meteor/check';
import { Mongo } from 'meteor/mongo';
import _ from 'underscore';

import { setUpdatedAt } from '../lib/setUpdatedAt';
import { metrics } from '../../../metrics/server/lib/metrics';
import { getOplogHandle } from './_oplogHandle';

const baseName = 'rocketchat_';

export const trash = new Mongo.Collection(`${ baseName }_trash`);
try {
	trash._ensureIndex({ __collection__: 1 });
	trash._ensureIndex(
		{ _deletedAt: 1 },
		{ expireAfterSeconds: 60 * 60 * 24 * 30 },
	);

	trash._ensureIndex({ rid: 1, __collection__: 1, _deletedAt: 1 });
} catch (e) {
	console.log(e);
}

const actions = {
	i: 'insert',
	u: 'update',
	d: 'remove',
};

export class BaseDb extends EventEmitter {
	constructor(model, baseModel, options = {}) {
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

		this.preventSetUpdatedAt = !!options.preventSetUpdatedAt;

		this.wrapModel();

		if (!process.env.DISABLE_DB_WATCH) {
			this.initDbWatch();
		}

		this.tryEnsureIndex({ _updatedAt: 1 }, options._updatedAtIndexOptions);
	}

	initDbWatch() {
		const _oplogHandle = Promise.await(getOplogHandle());

		// When someone start listening for changes we start oplog if available
		const handleListener = async (event /* , listener*/) => {
			if (event !== 'change') {
				return;
			}

			this.removeListener('newListener', handleListener);

			const query = {
				collection: this.collectionName,
			};

			if (!_oplogHandle) {
				throw new Error(`Error: Unable to find Mongodb Oplog. You must run the server with oplog enabled. Try the following:\n
				1. Start your mongodb in a replicaset mode: mongod --smallfiles --oplogSize 128 --replSet rs0\n
				2. Start the replicaset via mongodb shell: mongo mongo/meteor --eval "rs.initiate({ _id: ''rs0'', members: [ { _id: 0, host: ''localhost:27017'' } ]})"\n
				3. Start your instance with OPLOG configuration: export MONGO_OPLOG_URL=mongodb://localhost:27017/local MONGO_URL=mongodb://localhost:27017/meteor node main.js
				`);
			}

			_oplogHandle.onOplogEntry(
				query,
				this.processOplogRecord.bind(this),
			);
			// Meteor will handle if we have a value https://github.com/meteor/meteor/blob/5dcd0b2eb9c8bf881ffbee98bc4cb7631772c4da/packages/mongo/oplog_tailing.js#L5
			if (process.env.METEOR_OPLOG_TOO_FAR_BEHIND == null) {
				_oplogHandle._defineTooFarBehind(
					Number.MAX_SAFE_INTEGER,
				);
			}
		};

		if (_oplogHandle) {
			this.on('newListener', handleListener);
		}
	}

	get baseName() {
		return baseName;
	}

	setUpdatedAt(record = {}) {
		if (this.preventSetUpdatedAt) {
			return record;
		}
		// TODO: Check if this can be deleted, Rodrigo does not rememebr WHY he added it. So he removed it to fix issue #5541
		// setUpdatedAt(record = {}, checkQuery = false, query) {
		// if (checkQuery === true) {
		// 	if (!query || Object.keys(query).length === 0) {
		// 		throw new Meteor.Error('Models._Base: Empty query');
		// 	}
		// }

		setUpdatedAt(record);

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

	_ensureDefaultFields(options) {
		if (!this.baseModel.defaultFields) {
			return options;
		}

		if (!options) {
			return { fields: this.baseModel.defaultFields };
		}

		if (options.fields != null && Object.keys(options.fields).length > 0) {
			return options;
		}

		return {
			...options,
			fields: this.baseModel.defaultFields,
		};
	}

	_doNotMixInclusionAndExclusionFields(options) {
		const optionsDef = this._ensureDefaultFields(options);
		if (!optionsDef?.fields) {
			return optionsDef;
		}

		const keys = Object.keys(optionsDef.fields);
		const removeKeys = keys.filter((key) => optionsDef.fields[key] === 0);
		if (keys.length > removeKeys.length) {
			removeKeys.forEach((key) => delete optionsDef.fields[key]);
		}

		return optionsDef;
	}

	find(query = {}, options = {}) {
		const optionsDef = this._doNotMixInclusionAndExclusionFields(options);
		return this.model.find(query, optionsDef);
	}

	findById(_id, options) {
		return this.find({ _id }, options);
	}

	findOne(query = {}, options = {}) {
		const optionsDef = this._doNotMixInclusionAndExclusionFields(options);
		return this.model.findOne(query, optionsDef);
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
					&& this.updateHasPositionalOperator(update[key])),
		);
	}

	processOplogRecord({ id, op }) {
		const action = actions[op.op];
		metrics.oplog.inc({
			collection: this.collectionName,
			op: action,
		});

		if (action === 'insert') {
			this.emit('change', {
				action,
				clientAction: 'inserted',
				id: op.o._id,
				data: op.o,
				oplog: true,
			});
			return;
		}

		if (action === 'update') {
			if (!op.o.$set && !op.o.$unset) {
				this.emit('change', {
					action,
					clientAction: 'updated',
					id,
					data: op.o,
					oplog: true,
				});
				return;
			}

			const diff = {};
			if (op.o.$set) {
				for (const key in op.o.$set) {
					if (op.o.$set.hasOwnProperty(key)) {
						diff[key] = op.o.$set[key];
					}
				}
			}
			const unset = {};
			if (op.o.$unset) {
				for (const key in op.o.$unset) {
					if (op.o.$unset.hasOwnProperty(key)) {
						diff[key] = undefined;
						unset[key] = 1;
					}
				}
			}

			this.emit('change', {
				action,
				clientAction: 'updated',
				id,
				diff,
				unset,
				oplog: true,
			});
			return;
		}

		if (action === 'remove') {
			this.emit('change', {
				action,
				clientAction: 'removed',
				id,
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
