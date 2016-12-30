const baseName = 'rocketchat_';
import {EventEmitter} from 'events';

const trash = new Mongo.Collection(baseName + '_trash');
try {
	trash._ensureIndex({ collection: 1 });
	trash._ensureIndex({ _deletedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
} catch (e) {
	console.log(e);
}

class ModelsBaseDb extends EventEmitter {
	constructor(model) {
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

		this.wrapModel();

		this.tryEnsureIndex({ '_updatedAt': 1 });
	}

	get baseName() {
		return baseName;
	}

	setUpdatedAt(record = {}, checkQuery = false, query) {
		if (checkQuery === true) {
			if (!query || Object.keys(query).length === 0) {
				throw new Meteor.Error('Models._Base: Empty query');
			}
		}

		if (/(^|,)\$/.test(Object.keys(record).join(','))) {
			record.$set = record.$set || {};
			record.$set._updatedAt = new Date;
		} else {
			record._updatedAt = new Date;
		}

		return record;
	}

	wrapModel() {
		this.originals = {
			insert: this.model.insert.bind(this.model),
			update: this.model.update.bind(this.model),
			remove: this.model.remove.bind(this.model)
		};
		const self = this;

		this.model.insert = function() {
			return self.insert(...arguments);
		};

		this.model.update = function() {
			return self.update(...arguments);
		};

		this.model.remove = function() {
			return self.remove(...arguments);
		};
	}

	find() {
		return this.model.find(...arguments);
	}

	findOne() {
		return this.model.findOne(...arguments);
	}

	insert(record) {
		this.setUpdatedAt(record);

		const beforeInsertResult = {};
		this.emit('beforeInsert', beforeInsertResult, ...arguments);

		const result = this.originals.insert(...arguments);
		record._id = result;

		this.emit('afterInsert', beforeInsertResult, result, ...arguments);
		return result;
	}

	update(query, update, options = {}) {
		this.setUpdatedAt(update, true, query);

		const beforeUpdateResult = {};
		if (options.upsert === true) {
			this.emit('beforeUpsert', beforeUpdateResult, ...arguments);
		} else {
			this.emit('beforeUpdate', beforeUpdateResult, ...arguments);
		}

		const result = this.originals.update(query, update, options);

		if (options.upsert === true) {
			this.emit('afterUpsert', beforeUpdateResult, result, ...arguments);
		} else {
			this.emit('afterUpdate', beforeUpdateResult, result, ...arguments);
		}
		return result;
	}

	upsert(query, update, options = {}) {
		options.upsert = true;
		options._returnObject = true;
		return this.update(query, update, options);
	}

	remove(query) {
		const beforeRemoveResult = {};
		this.emit('beforeRemove', beforeRemoveResult, ...arguments);

		const records = this.model.find(query).fetch();

		const ids = [];
		for (const record of records) {
			ids.push(record._id);

			record._deletedAt = new Date;
			record.__collection__ = this.name;

			trash.upsert({_id: record._id}, _.omit(record, '_id'));
		}

		query = { _id: { $in: ids } };

		const result = this.originals.remove(query);
		this.emit('afterRemove', beforeRemoveResult, result, records, ...arguments);
		return result;
	}

	insertOrUpsert(...args) {
		if (args[0] && args[0]._id) {
			const _id = args[0]._id;
			delete args[0]._id;
			args.unshift({
				_id: _id
			});

			this.upsert(...args);
			return _id;
		} else {
			return this.insert(...args);
		}
	}

	allow() {
		return this.model.allow(...arguments);
	}

	deny() {
		return this.model.deny(...arguments);
	}

	ensureIndex() {
		return this.model._ensureIndex(...arguments);
	}

	dropIndex() {
		return this.model._dropIndex(...arguments);
	}

	tryEnsureIndex() {
		try {
			return this.ensureIndex(...arguments);
		} catch (e) {
			console.error('Error creating index:', this.name, '->', ...arguments, e);
		}
	}

	tryDropIndex() {
		try {
			return this.dropIndex(...arguments);
		} catch (e) {
			console.error('Error dropping index:', this.name, '->', ...arguments, e);
		}
	}

	trashFind(query, options) {
		query.__collection__ = this.name;

		return trash.find(query, options);
	}

	trashFindDeletedAfter(deletedAt, query = {}, options) {
		query.__collection__ = this.name;
		query._deletedAt = {
			$gt: deletedAt
		};

		return trash.find(query, options);
	}
}

export default ModelsBaseDb;
