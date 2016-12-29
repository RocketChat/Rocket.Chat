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
		const originals = {
			insert: this.model.insert,
			update: this.model.update,
			// upsert: this.model.upsert,
			remove: this.model.remove
		};
		const self = this;

		this.model.insert = function() {
			const beforeInsertResult = {};
			self.emit('beforeInsert', beforeInsertResult, ...arguments);
			const result = originals.insert.apply(self.model, arguments);
			self.emit('afterInsert', beforeInsertResult, result, ...arguments);
			return result;
		};
		this.model.update = function(query, update, options = {}) {
			const beforeUpdateResult = {};
			if (options.upsert === true) {
				self.emit('beforeUpsert', beforeUpdateResult, ...arguments);
			} else {
				self.emit('beforeUpdate', beforeUpdateResult, ...arguments);
			}
			const result = originals.update.apply(self.model, arguments);
			if (options.upsert === true) {
				self.emit('afterUpsert', beforeUpdateResult, result, ...arguments);
			} else {
				self.emit('afterUpdate', beforeUpdateResult, result, ...arguments);
			}
			return result;
		};
		// this.model.upsert = function() {
		// 	const beforeUpsert = self.emit('beforeUpsert', ...arguments);
		// 	const result = originals.upsert.apply(self.model, arguments);
		// 	self.emit('afterUpsert', beforeUpsert, result, ...arguments);
		// 	return result;
		// };
		this.model.remove = function() {
			const beforeRemoveResult = {};
			self.emit('beforeRemove', beforeRemoveResult, ...arguments);
			const result = originals.remove.apply(self.model, arguments);
			self.emit('afterRemove', beforeRemoveResult, result, ...arguments);
			return result;
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

		const result = this.model.insert(...arguments);
		record._id = result;
		// this.emit('afterInsert', result, record);
		return result;
	}

	update(query, update, options = {}) {
		if (options.upsert) {
			return this.upsert(query, update);
		}

		this.setUpdatedAt(update, true, query);
		// const beforeUpdate = this.emit('beforeUpdate', query, update, options);

		const result = this.model.update(query, update, options);
		// this.emit('afterUpdate', beforeUpdate, result, query, update, options);
		return result;
	}

	upsert(query, update) {
		this.setUpdatedAt(update, true, query);
		// const beforeUpsert = this.emit('beforeUpsert', ...arguments);

		const result = this.model.upsert(...arguments);
		// this.emit('afterUpsert', beforeUpsert, result, ...arguments);
		return result;
	}

	remove(query) {
		const records = this.model.find(query).fetch();
		this.emit('beforeRemove', query, records);

		const ids = [];
		for (const record of records) {
			ids.push(record._id);

			record._deletedAt = new Date;
			record.__collection__ = this.name;

			trash.upsert({_id: record._id}, _.omit(record, '_id'));
		}

		query = { _id: { $in: ids } };

		return this.model.remove(query);
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
