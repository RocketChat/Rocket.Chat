const {EventEmitter} = Npm.require('events');

const baseName = 'rocketchat_';

const trash = new Mongo.Collection(baseName + '_trash');
try {
	trash._ensureIndex({ collection: 1 });
	trash._ensureIndex({ _updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
} catch (e) {
	console.log(e);
}

class ModelsBase extends EventEmitter {
	_baseName() {
		return baseName;
	}

	_initModel(name) {
		check(name, String);

		this.name = name;

		this.model = new Mongo.Collection(this._baseName() + name);
	}

	setUpdatedAt(record = {}) {
		if (/(^|,)\$/.test(Object.keys(record).join(','))) {
			record.$set = record.$set || {};
			record.$set._updatedAt = new Date;
		} else {
			record._updatedAt = new Date;
		}

		return record;
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
		this.emit('insert', record);
		this.emit('change', 'insert', record);
		return result;
	}

	update(query, update, options = {}) {
		this.setUpdatedAt(update);

		if (options.upsert) {
			return this.upsert(query, update);
		}

		let ids = [];
		if (options.multi === true) {
			ids = ids.concat(this.model.find(query, { fields: { _id: 1 } }).fetch());
		} else {
			ids.push(this.model.findOne(query, { fields: { _id: 1 } }));
		}

		query = { _id: { $in: _.pluck(ids, '_id') } };
		const result = this.model.update(query, update, options);
		this.emit('update', query, update);
		this.emit('change', 'update', query, update);
		return result;
	}

	upsert(query, update) {
		this.setUpdatedAt(update);

		const id = this.model.findOne(query, { fields: { _id: 1 } });
		const result = this.model.upsert(...arguments);

		let record = id;
		if (result.insertedId) {
			record = { _id: result.insertedId };
		}

		this.emit('update', record);
		this.emit('change', 'update', record);
		return result;
	}

	remove(query) {
		const records = this.model.find(query).fetch();

		const ids = [];
		for (const record of records) {
			ids.push(record._id);

			record._deletedAt = new Date;
			record.__collection__ = this.name;

			trash.insert(record);
		}

		query = { _id: { $in: ids } };

		this.emit('remove', records);
		this.emit('change', 'remove', records);
		return this.model.remove(query);
	}

	insertOrUpsert(...args) {
		if (args[0] && args[0]._id) {
			const _id = args[0]._id;
			delete args[0]._id;
			args.unshift({
				_id: _id
			});

			this.model.upsert(...args);
			return _id;
		} else {
			return this.model.insert(...args);
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
			console.log(e);
		}
	}

	tryDropIndex() {
		try {
			return this.dropIndex(...arguments);
		} catch (e) {
			console.log(e);
		}
	}

	getChangedRecords(type, recordOrQuery, fields) {
		if (type === 'insert') {
			return [recordOrQuery];
		}

		if (type === 'remove') {
			return recordOrQuery;
		}

		if (type === 'update') {
			const options = {};
			if (fields) {
				options.fields = fields;
			}
			return this.find(recordOrQuery, options).fetch();
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

	dinamicTrashFindAfter(method, deletedAt, ...args) {
		const scope = {
			find: (query={}) => {
				return this.trashFindDeletedAfter(deletedAt, query, { fields: {_id: 1, _deletedAt: 1} });
			}
		};

		scope.model = {
			find: scope.find
		};

		return this[method].apply(scope, args);
	}

	dinamicFindAfter(method, updatedAt, ...args) {
		const scope = {
			find: (query={}, options) => {
				query._updatedAt = {
					$gt: updatedAt
				};

				return this.find(query, options);
			}
		};

		scope.model = {
			find: scope.find
		};

		return this[method].apply(scope, args);
	}

	dinamicFindChangesAfter(method, updatedAt, ...args) {
		return {
			update: this.dinamicFindAfter(method, updatedAt, ...args).fetch(),
			remove: this.dinamicTrashFindAfter(method, updatedAt, ...args).fetch()
		};
	}

}

RocketChat.models._Base = ModelsBase;
