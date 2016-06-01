const {EventEmitter} = Npm.require('events');

class ModelsBase extends EventEmitter {
	_baseName() {
		return 'rocketchat_';
	}

	_initModel(name) {
		check(name, String);

		this.model = new Mongo.Collection(this._baseName() + name);
	}

	find() {
		return this.model.find(...arguments);
	}

	findOne() {
		return this.model.findOne(...arguments);
	}

	insert() {
		const result = this.model.insert(...arguments);
		const record = _.extend({ _id: result }, arguments[0]);
		this.emit('insert', record);
		this.emit('change', 'insert', record);
		return result;
	}

	update(query, update, options = {}) {
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

	upsert(query) {
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

	remove() {
		this.emit('remove', ...arguments);
		this.emit('change', 'remove', ...arguments);
		return this.model.remove(...arguments);
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

		const options = {};
		if (fields) {
			options.fields = fields;
		}

		if (type === 'update' || type === 'remove') {
			return this.find(recordOrQuery, options).fetch();
		}
	}
}

RocketChat.models._Base = ModelsBase;
