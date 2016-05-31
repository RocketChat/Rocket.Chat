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
		this.emit('insert', ...arguments);
		this.emit('change', 'insert', ...arguments);
		return this.model.insert(...arguments);
	}

	update() {
		const result = this.model.update(...arguments);
		this.emit('update', ...arguments);
		this.emit('change', 'update', ...arguments);
		return result;
	}

	upsert() {
		const result = this.model.upsert(...arguments);

		if (result.insertedId) {
			const record = _.extend({ _id: result.insertedId }, arguments[0], arguments[1]);
			this.emit('insert', record);
			this.emit('change', 'insert', record);
		} else {
			this.emit('update', arguments[0]);
			this.emit('change', 'update', arguments[0]);
		}
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
